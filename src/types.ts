import type { ComponentType } from 'react';

export type ToolCategory =
  | 'Encode'
  | 'Convert'
  | 'Format'
  | 'Generate'
  | 'Inspect'
  | 'Decode'
  | 'Time';

export interface ToolMeta {
  id: string;
  name: string;
  category: ToolCategory;
  keywords?: string[];
  icon?: string;
}

export interface Tool extends ToolMeta {
  component: ComponentType;
}

export type ToolEntry = Tool;

export interface ToolModule {
  meta: ToolMeta;
  component: ComponentType;
}
