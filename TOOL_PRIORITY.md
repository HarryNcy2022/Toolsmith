# Pending Tools

Toolsmith currently ships 36 tools. New tools are demand-driven; only these remain under consideration.

| Tool | Category | Status | Implementation note |
|------|----------|--------|---------------------|
| String Inspector | Inspect | Pending | Use `TextEncoder`; show characters, Unicode code points, UTF-8 bytes, length, and byte count. |
| Certificate Decoder (X.509) | Decode | Pending | Parse PEM/DER locally; likely needs `node-forge` and careful renderer bundle review. |

## Decision rule

- Implement only after a concrete use case or user request.
- Keep processing offline and browser-safe.
- Any newly proposed tool must earn its maintenance and bundle cost.
- Previously considered LESS, SVG-to-CSS, PHP, serializer, and ERB tools are dropped.
