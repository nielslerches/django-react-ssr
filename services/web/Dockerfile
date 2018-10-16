FROM fedora:28

ENV PYTHONUNBUFFERED 1

RUN dnf -y install curl

RUN curl --silent --location https://rpm.nodesource.com/setup_10.x | bash -
RUN dnf -y install gcc-c++ make nodejs

COPY requirements.txt /tmp
RUN pip3 install -r /tmp/requirements.txt

WORKDIR /mnt
ADD . /mnt
RUN npm install

ENTRYPOINT ["/usr/local/bin/dumb-init", "--"]
