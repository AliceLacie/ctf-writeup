FROM node:23.10.0

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

RUN apt-get update && apt-get install -y gcc

RUN head /dev/urandom | tr -dc A-Za-z0-9 | head -c 16 > /tmp/myrand.txt

RUN gcc -o readflag_$(cat /tmp/myrand.txt) readflag.c

RUN mv readflag_$(cat /tmp/myrand.txt) /readflag_$(cat /tmp/myrand.txt)
RUN mv flag /flag

RUN chmod 4755 /readflag_$(cat /tmp/myrand.txt)
RUN chmod 400 /flag

RUN rm -rf /tmp/myrand.txt

RUN adduser user

USER user

CMD ["node", "src/app.js"]