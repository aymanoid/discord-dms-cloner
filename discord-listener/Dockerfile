FROM python:3.10-slim

WORKDIR /app

ADD . /app

RUN apt-get update

RUN apt-get -y install gcc

RUN pip install -r requirements.txt

CMD ["python", "main.py"]