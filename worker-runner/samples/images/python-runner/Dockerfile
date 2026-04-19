FROM python:3.12-slim

# The container is run as uid 1000 by the host-side Docker flags. Create a
# matching non-root user so Python tools have a real home directory if needed.
RUN useradd --create-home --uid 1000 runner

WORKDIR /workspace

COPY inference.py benchmark.py /opt/runner/

USER runner

CMD ["python", "--version"]
