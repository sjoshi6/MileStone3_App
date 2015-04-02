# MileStone3_App

## Command to run ansible and setup a configured ec2 instance
#### ansible-playbook ./playbook.yml --private-key ./sjoshi6.pem -i private/ansible/hosts -u ubuntu

## Hosts file
```
[ubuntu]
54.187.199.56
```

####

## Playbook file

```
---
- hosts: all
  sudo: yes
  tasks:
  - name: install basics
    apt: update_cache=yes pkg={{ item }}
    with_items:
      - apt-transport-https
      - curl
      - git
      - vim
      - python-pip
      - nodejs
      - npm

  - name: install http-server
    npm: name=http-server global=yes

  - name: install forever npm package
    npm: name=forever global=yes

  - name: make soft link for nodejs
    file: state=link src=/usr/bin/nodejs dest=/usr/bin/node
```
