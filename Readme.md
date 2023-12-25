A simple cloud storage made with Nodejs and Vue

### Docker
Move Dockerfile to release folder, and run following.
```
docker build . -t mini-driver
```
```
docker run \
-e "NODE_ENV=production" \
-p 3000:3000 \
--name mini-driver \
mini-driver:latest
```
Change app/backend_dist/config.ts in the container if needed