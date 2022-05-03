FROM python:3.9-slim

RUN apt-get update && apt-get upgrade -y && apt-get install gcc -y

COPY requirements.txt ./requirements.txt
RUN pip install -r requirements.txt

COPY ./app /app
WORKDIR /app
EXPOSE 8050
CMD gunicorn -b 0.0.0.0:8050 --timeout 600 app:server
