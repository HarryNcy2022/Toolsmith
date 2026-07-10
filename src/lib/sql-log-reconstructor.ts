export type SqlLogFormat = 'auto' | 'manual' | 'mybatis' | 'hibernate';
export type DetectedSqlLogFormat = Exclude<SqlLogFormat, 'auto'>;
export type SqlLiteralDialect = 'generic' | 'oracle' | 'postgresql';

export interface SqlBind {
  position: number;
  type: string;
  value: string;
}

export interface ParsedSqlLog {
  sql: string;
  parameters: SqlBind[];
  format: DetectedSqlLogFormat;
}

export interface SqlReconstructionResult extends ParsedSqlLog {
  reconstructedSql: string;
  warnings: string[];
}

const NUMBER_TYPES = /^(?:byte|short|int|integer|long|float|double|decimal|bigdecimal|number|numeric|real)$/i;
const BOOLEAN_TYPES = /^(?:bool|boolean|bit)$/i;
const BINARY_TYPES = /^(?:binary|varbinary|longvarbinary|blob|byte\[\])$/i;

function splitParameterList(input: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let depth = 0;
  let quote: string | null = null;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (quote) {
      if (char === quote && input[i - 1] !== '\\') quote = null;
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
    } else if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth = Math.max(0, depth - 1);
    } else if (char === ',' && depth === 0) {
      const candidate = input.slice(start, i).trim();
      if (candidate.endsWith(')') || /^null$/i.test(candidate)) {
        parts.push(candidate);
        start = i + 1;
      }
    }
  }

  const last = input.slice(start).trim();
  if (last) parts.push(last);
  return parts;
}

function parseParameterList(input: string): SqlBind[] {
  return splitParameterList(input).map((part, index) => {
    const match = part.match(/^(.*)\(([^()]*)\)$/s);
    return {
      position: index + 1,
      type: match?.[2].trim() || 'unknown',
      value: (match?.[1] ?? part).trim()
    };
  });
}

function parseMyBatis(input: string): ParsedSqlLog {
  const preparing = input.match(/\bPreparing:\s*(.+)$/im);
  if (!preparing) throw new Error('No MyBatis/JDBC "Preparing:" SQL found.');

  const parameters = input.match(/\bParameters:\s*(.*)$/im);
  return {
    sql: preparing[1].trim(),
    parameters: parameters ? parseParameterList(parameters[1]) : [],
    format: 'mybatis'
  };
}

function parseHibernate(input: string): ParsedSqlLog {
  const lines = input.split(/\r?\n/);
  const sqlLines: string[] = [];
  const parameters: SqlBind[] = [];
  let readingSql = false;

  for (const line of lines) {
    const squareBinding = line.match(/binding parameter \[(\d+)\] as \[([^\]]+)\] - \[(.*)\]\s*>?\s*$/i);
    const arrowBinding = line.match(/binding parameter \((\d+)\s*:\s*([^)]+)\)\s*<-\s*\[(.*)\]\s*>?\s*$/i);
    const binding = squareBinding ?? arrowBinding;
    if (binding) {
      parameters.push({
        position: Number(binding[1]),
        type: binding[2].trim(),
        value: binding[3]
      });
      readingSql = false;
      continue;
    }

    const loggerStatement = line.match(
      /\[(?:[^\]]*SqlStatementLogger:logStatement|org\.hibernate\.SQL)\]\s*(.*)$/i
    );
    if (loggerStatement) {
      readingSql = false;
      let sql = loggerStatement[1].trim();
      if (/^\s*####</.test(line) || sql.endsWith('?>')) {
        sql = sql.replace(/>\s*$/, '').trimEnd();
      }
      if (sql) sqlLines.push(sql);
      continue;
    }

    const marker = line.match(/Hibernate:\s*(.*)$/i);
    if (marker) {
      readingSql = true;
      if (marker[1].trim()) sqlLines.push(marker[1].trim());
      continue;
    }

    if (readingSql && line.trim()) sqlLines.push(line.trim());
  }

  if (sqlLines.length === 0) throw new Error('No supported Hibernate SQL statement found.');
  parameters.sort((a, b) => a.position - b.position);
  return { sql: sqlLines.join('\n'), parameters, format: 'hibernate' };
}

function parseManual(input: string): ParsedSqlLog {
  const lines = input.split(/\r?\n/);
  const parameterIndex = lines.findIndex((line) => /\b(?:Parameters|Binds?):\s*/i.test(line));
  let sqlLines = parameterIndex >= 0 ? lines.slice(0, parameterIndex) : lines;
  const parameterMatch = parameterIndex >= 0
    ? lines[parameterIndex].match(/\b(?:Parameters|Binds?):\s*(.*)$/i)
    : null;

  sqlLines = sqlLines.filter((line) => line.trim());
  if (sqlLines.length > 0) sqlLines[0] = sqlLines[0].replace(/^\s*SQL:\s*/i, '');
  const sql = sqlLines.join('\n').trim();
  if (!sql) throw new Error('No SQL found.');

  return {
    sql,
    parameters: parameterMatch ? parseParameterList(parameterMatch[1]) : [],
    format: 'manual'
  };
}

export function detectSqlLogFormat(input: string): DetectedSqlLogFormat {
  if (
    /binding parameter (?:\[\d+\]|\(\d+\s*:)/i.test(input) ||
    /Hibernate:/i.test(input) ||
    /SqlStatementLogger:logStatement/i.test(input) ||
    /\[org\.hibernate\.SQL\]/i.test(input)
  ) {
    return 'hibernate';
  }
  if (/\bPreparing:/i.test(input)) return 'mybatis';
  return 'manual';
}

export function parseSqlLog(input: string, format: SqlLogFormat = 'auto'): ParsedSqlLog {
  const detected = format === 'auto' ? detectSqlLogFormat(input) : format;
  if (detected === 'mybatis') return parseMyBatis(input);
  if (detected === 'hibernate') return parseHibernate(input);
  return parseManual(input);
}

function quote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

export function renderSqlLiteral(bind: SqlBind, dialect: SqlLiteralDialect): string {
  const value = bind.value.trim();
  const type = bind.type.trim();
  if (/^null$/i.test(value)) return 'NULL';

  if (NUMBER_TYPES.test(type) && /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value)) {
    return value;
  }
  if (BOOLEAN_TYPES.test(type) && /^(?:true|false|0|1)$/i.test(value)) {
    if (value === '1') return 'TRUE';
    if (value === '0') return 'FALSE';
    return value.toUpperCase();
  }
  if (/timestamp|datetime/i.test(type)) {
    if (dialect === 'oracle') {
      const mask = value.includes('.') ? 'YYYY-MM-DD HH24:MI:SS.FF' : 'YYYY-MM-DD HH24:MI:SS';
      return `TO_TIMESTAMP(${quote(value)}, '${mask}')`;
    }
    if (dialect === 'postgresql') return `TIMESTAMP ${quote(value)}`;
  }
  if (/^date$/i.test(type)) {
    if (dialect === 'oracle') return `TO_DATE(${quote(value)}, 'YYYY-MM-DD')`;
    if (dialect === 'postgresql') return `DATE ${quote(value)}`;
  }
  if (BINARY_TYPES.test(type) && /^(?:0x)?[0-9a-f]+$/i.test(value)) {
    const hex = value.replace(/^0x/i, '');
    if (dialect === 'oracle') return `HEXTORAW('${hex}')`;
    if (dialect === 'postgresql') return `decode('${hex}', 'hex')`;
    return `X'${hex}'`;
  }
  return quote(value);
}

function bindQuestionMarks(sql: string, parameters: SqlBind[], dialect: SqlLiteralDialect) {
  let output = '';
  let bindIndex = 0;
  let state: 'normal' | 'single' | 'double' | 'backtick' | 'line-comment' | 'block-comment' = 'normal';
  let dollarTag: string | null = null;

  for (let i = 0; i < sql.length; i += 1) {
    const char = sql[i];
    const next = sql[i + 1];

    if (dollarTag) {
      if (sql.startsWith(dollarTag, i)) {
        output += dollarTag;
        i += dollarTag.length - 1;
        dollarTag = null;
      } else {
        output += char;
      }
      continue;
    }

    if (state === 'single' || state === 'double' || state === 'backtick') {
      output += char;
      if (char === '\\' && next) {
        output += next;
        i += 1;
        continue;
      }
      const closing = state === 'single' ? "'" : state === 'double' ? '"' : '`';
      if (char === closing) {
        if (next === closing) {
          output += next;
          i += 1;
        } else {
          state = 'normal';
        }
      }
      continue;
    }
    if (state === 'line-comment') {
      output += char;
      if (char === '\n') state = 'normal';
      continue;
    }
    if (state === 'block-comment') {
      output += char;
      if (char === '*' && next === '/') {
        output += next;
        i += 1;
        state = 'normal';
      }
      continue;
    }

    if (char === "'") state = 'single';
    else if (char === '"') state = 'double';
    else if (char === '`') state = 'backtick';
    else if (char === '-' && next === '-') state = 'line-comment';
    else if (char === '/' && next === '*') state = 'block-comment';
    else if (char === '$') {
      const match = sql.slice(i).match(/^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/);
      if (match) {
        dollarTag = match[0];
        output += dollarTag;
        i += dollarTag.length - 1;
        continue;
      }
    } else if (char === '?') {
      const bind = parameters[bindIndex];
      if (bind) output += renderSqlLiteral(bind, dialect);
      else output += '?';
      bindIndex += 1;
      continue;
    }

    output += char;
    if ((char === '-' && next === '-') || (char === '/' && next === '*')) {
      output += next;
      i += 1;
    }
  }

  return { output, placeholderCount: bindIndex };
}

export function reconstructSqlLog(
  input: string,
  format: SqlLogFormat = 'auto',
  dialect: SqlLiteralDialect = 'generic'
): SqlReconstructionResult {
  const parsed = parseSqlLog(input, format);
  const { output, placeholderCount } = bindQuestionMarks(parsed.sql, parsed.parameters, dialect);
  const warnings: string[] = [];

  if (placeholderCount > parsed.parameters.length) {
    warnings.push(`${placeholderCount - parsed.parameters.length} placeholder(s) have no bind value.`);
  }
  if (parsed.parameters.length > placeholderCount) {
    warnings.push(`${parsed.parameters.length - placeholderCount} bind value(s) were not used.`);
  }

  return { ...parsed, reconstructedSql: output, warnings };
}
