FROM python:3.12-slim

WORKDIR /code

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Install the project (deps + editable app package) so `app.*` resolves on the path.
COPY . .
RUN pip install --no-cache-dir -e .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]