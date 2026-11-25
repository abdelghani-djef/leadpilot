# Deploying to a small VPS

LeadPilot runs on the server as two containers: the app, and Caddy in front of it for HTTPS.
The image is built on your own computer and uploaded, because building Next.js needs more
memory than a small VPS has.

## First time

On the server, create a folder with the two files from this directory and a `.env`:

```bash
mkdir -p ~/leadpilot
scp deploy/compose.vps.yml deploy/Caddyfile my-server:~/leadpilot/
```

`~/leadpilot/.env` on the server (keep it private, `chmod 600 .env`):

```
SITE_ADDRESS=leadpilot.example.com
GROQ_API_KEY=...
ADMIN_PASSWORD=...
SHOW_ANALYSIS_TO_VISITOR=true
DAILY_LEAD_LIMIT=200
```

No domain? Use a free sslip.io name built from the server's public IP, for example
`leadpilot.35-180-91-97.sslip.io` for 35.180.91.97. If the server's IP can change (an AWS
instance without an Elastic IP), attach an Elastic IP first.

The server's firewall (on AWS: the instance's security group) must allow inbound TCP 80 and 443.

## Each release

From the project folder on your computer:

```bash
docker build --build-arg NEXT_PUBLIC_CONTACT_URL='https://example.com/#contact' -t leadpilot:latest .
docker save leadpilot:latest | gzip | ssh my-server 'gunzip | sudo docker load'
ssh my-server 'cd ~/leadpilot && sudo docker compose -f compose.vps.yml up -d'
```

Leads are stored in the `leadpilot-data` volume and survive updates.

## Useful commands on the server

```bash
cd ~/leadpilot
sudo docker compose -f compose.vps.yml ps        # status
sudo docker compose -f compose.vps.yml logs -f   # logs
grep ADMIN_PASSWORD .env                         # dashboard password
```
