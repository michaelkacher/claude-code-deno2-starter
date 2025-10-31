/**
 * OpenAPI documentation routes
 * Serves the OpenAPI specification and Swagger UI
 */

import { Hono } from 'hono';
import openApiSpec from '../openapi.json' with { type: 'json' };

const app = new Hono();

/**
 * GET /openapi.json - OpenAPI specification
 * Returns the complete OpenAPI 3.1 specification in JSON format
 */
app.get('/openapi.json', (c) => {
  return c.json(openApiSpec);
});

/**
 * GET /docs - Swagger UI
 * Interactive API documentation interface
 */
app.get('/docs', (c) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation - Swagger UI</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.5/swagger-ui.css">
  <style>
    body {
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.5/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        tryItOutEnabled: true,
        displayRequestDuration: true,
        filter: true,
        syntaxHighlight: {
          activate: true,
          theme: "agate"
        }
      });
    };
  </script>
</body>
</html>
  `;

  return c.html(html);
});

/**
 * GET /redoc - ReDoc UI
 * Alternative API documentation interface with a cleaner design
 */
app.get('/redoc', (c) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation - ReDoc</title>
  <style>
    body {
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  <redoc spec-url='/api/openapi.json'></redoc>
  <script src="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js"></script>
</body>
</html>
  `;

  return c.html(html);
});

export default app;
