"""Serve the production frontend with real APIs on one local origin, using disposable data.

This verifies the built browser client, not Vercel infrastructure or PostgreSQL.
"""
import os
from pathlib import Path
import sys
import tempfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

if __name__ == '__main__':
    with tempfile.TemporaryDirectory(prefix='abi-built-ui-') as directory:
        os.environ.update(DATABASE_URL='sqlite:///' + (Path(directory) / 'browser.db').as_posix(),
                          ENV='dev', VERCEL='false', ENABLE_LLM_ASSISTANT='false', AUTH_REQUIRED='true',
                          AUTH_ADMIN_PASSWORD='isolated-admin-browser-password',
                          AUTH_ANALYST_PASSWORD='isolated-analyst-browser-password')
        from app.main import app
        from app.database.session import engine
        from tests.database_fixture import seed_synthetic_warehouse
        from starlette.exceptions import HTTPException
        from fastapi.responses import FileResponse, JSONResponse
        from fastapi.staticfiles import StaticFiles
        import uvicorn
        seed_synthetic_warehouse(engine)
        dist = Path(__file__).resolve().parents[2] / 'frontend/dist'

        class SPA(StaticFiles):
            async def get_response(self, path, scope):
                path = path.replace('\\', '/').lstrip('/')
                if path == 'api' or path.startswith(('api/', 'health/', 'docs/')):
                    return JSONResponse({'detail': 'Not Found'}, status_code=404)
                if path.startswith('assets/'):
                    return await super().get_response(path, scope)
                try:
                    return await super().get_response(path, scope)
                except HTTPException as error:
                    if error.status_code != 404:
                        raise
                    return FileResponse(dist / 'index.html')

        app.mount('/', SPA(directory=dist, html=True))
        try:
            uvicorn.run(app, host='127.0.0.1', port=5190)
        finally:
            engine.dispose()
