#!/bin/bash

gunicorn --bind 0.0.0.0:8080 fecfiler.wsgi -w 10 -t 200