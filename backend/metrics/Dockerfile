# FROM python:3.9
FROM python:3.9-slim

RUN apt-get update && apt-get upgrade -y && apt-get install gcc -y


# ENV DASH_DEBUG_MODE True
COPY requirements.txt ./requirements.txt
RUN pip install -r requirements.txt

COPY ./app /app
WORKDIR /app
# RUN set -ex && \
#     pip install -r requirements.txt
EXPOSE 8050
CMD ["python", "app.py"]

