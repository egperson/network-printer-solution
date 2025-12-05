# Plano de Deploy - Magalu Cloud

## Arquitetura Simplificada

```
┌─────────────────────────────────────────┐
│  Rede Local da Empresa                  │
│                                          │
│  ┌──────────────────────────────────┐  │
│  │  Agente Local (Node.js)          │  │
│  │  - Escaneia impressoras          │  │
│  │  - Envia para cloud              │  │
│  └──────────────┬───────────────────┘  │
└─────────────────┼───────────────────────┘
                  │ HTTPS
                  ▼
┌─────────────────────────────────────────────────┐
│           Magalu Cloud                          │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  VPS Backend (1 vCPU, 1GB RAM)           │ │
│  │  IP: xxx.xxx.xxx.xxx                      │ │
│  │  - Ubuntu 22.04                           │ │
│  │  - Node.js 18                             │ │
│  │  - PM2                                     │ │
│  │  - Nginx (reverse proxy)                  │ │
│  │  Porta 3000 → API REST                    │ │
│  └───────────────┬───────────────────────────┘ │
│                  │                               │
│  ┌───────────────▼───────────────────────────┐ │
│  │  Database PostgreSQL                      │ │
│  │  (Managed Database - 1GB)                 │ │
│  │  - Backups automáticos                    │ │
│  │  - Alta disponibilidade                   │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  VPS Frontend (1 vCPU, 512MB RAM)        │ │
│  │  IP: yyy.yyy.yyy.yyy                      │ │
│  │  - Ubuntu 22.04                           │ │
│  │  - Nginx (serve arquivos estáticos)       │ │
│  │  Porta 80/443 → React Build               │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  Domínio (opcional)                       │ │
│  │  printmonitor.com.br                      │ │
│  │  - Frontend: app.printmonitor.com.br      │ │
│  │  - Backend: api.printmonitor.com.br       │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## Custos Magalu Cloud (Mensal)

| Item | Especificação | Custo |
|------|--------------|-------|
| **VPS Backend** | 1 vCPU, 1GB RAM, 20GB SSD | R$ 24,90 |
| **VPS Frontend** | 1 vCPU, 512MB RAM, 20GB SSD | R$ 19,90 |
| **Database PostgreSQL** | 1GB RAM, 10GB Storage | R$ 49,90 |
| **Bandwidth** | 1TB (incluso) | R$ 0 |
| **Backup** | Database backup semanal | R$ 10,00 |
| **SSL Certificate** | Let's Encrypt (grátis) | R$ 0 |
| **Domínio .com.br** | Registro Global (opcional) | R$ 40/ano (~R$ 3,33/mês) |
| **TOTAL** | | **R$ 107,83/mês** |

**Para 3 usuários**: **R$ 35,94/usuário/mês**

### Escalabilidade
- **10 usuários**: Mesma infra → R$ 10,78/user
- **50 usuários**: Upgrade VPS Backend (2 vCPU) → +R$ 25 = R$ 132,83/mês
- **100+ usuários**: Considerar load balancer → ~R$ 200/mês

---

## Setup Inicial da Infraestrutura

### 1. Criar VPS Backend

**Painel Magalu Cloud**:
1. Criar VPS
   - Nome: `printmonitor-backend`
   - S.O: Ubuntu 22.04 LTS
   - Plano: 1 vCPU, 1GB RAM, 20GB SSD
   - Região: São Paulo (menor latência)
2. Anotar IP público
3. Configurar SSH key

**Acesso inicial**:
```bash
ssh root@IP_BACKEND
```

**Instalação**:
```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Instalar PM2 (process manager)
npm install -g pm2

# Instalar Nginx
apt install -y nginx

# Firewall
ufw allow 22
ufw allow 80
ufw allow 443
ufw allow 3000
ufw enable
```

### 2. Criar Database PostgreSQL

**Painel Magalu Cloud**:
1. Managed Database > Criar
   - Tipo: PostgreSQL 15
   - Plano: 1GB RAM, 10GB Storage
   - Nome: `printmonitor-db`
2. Anotar:
   - Host: `xxx.postgres.magalu.cloud`
   - Port: `5432`
   - Database: `printmonitor`
   - User: `admin`
   - Password: `[gerado automaticamente]`

**String de Conexão**:
```
postgresql://admin:PASSWORD@xxx.postgres.magalu.cloud:5432/printmonitor
```

### 3. Criar VPS Frontend

**Painel Magalu Cloud**:
1. Criar VPS
   - Nome: `printmonitor-frontend`
   - S.O: Ubuntu 22.04 LTS
   - Plano: 1 vCPU, 512MB RAM, 20GB SSD
2. Anotar IP público

**Instalação**:
```bash
ssh root@IP_FRONTEND

# Atualizar
apt update && apt upgrade -y

# Instalar Nginx
apt install -y nginx certbot python3-certbot-nginx

# Firewall
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

---

## Deploy Backend (VPS 1)

### 1. Enviar Código

**No seu PC**:
```bash
# Fazer build e comprimir
cd backend
tar -czf backend.tar.gz *

# Enviar para servidor
scp backend.tar.gz root@IP_BACKEND:/root/
```

**No servidor**:
```bash
cd /root
mkdir -p /var/www/printmonitor-backend
tar -xzf backend.tar.gz -C /var/www/printmonitor-backend
cd /var/www/printmonitor-backend
```

### 2. Configurar Ambiente

```bash
# Instalar dependências
npm install --production

# Criar .env
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://admin:PASSWORD@xxx.postgres.magalu.cloud:5432/printmonitor
JWT_SECRET=$(openssl rand -hex 32)
CORS_ORIGIN=http://IP_FRONTEND
EOF
```

### 3. Configurar PM2

```bash
# Iniciar aplicação
pm2 start server.js --name printmonitor-api

# Auto-start on reboot
pm2 startup
pm2 save

# Monitorar
pm2 logs printmonitor-api
pm2 status
```

### 4. Configurar Nginx (Reverse Proxy)

```bash
cat > /etc/nginx/sites-available/printmonitor-api << 'EOF'
server {
    listen 80;
    server_name IP_BACKEND;  # Ou api.printmonitor.com.br

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

# Ativar site
ln -s /etc/nginx/sites-available/printmonitor-api /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 5. Testar

```bash
curl http://IP_BACKEND/health
# Deve retornar: {"status":"ok","timestamp":"..."}
```

---

## Deploy Frontend (VPS 2)

### 1. Build Local

**No seu PC**:
```bash
cd frontend

# Configurar API URL
cat > .env.production << EOF
VITE_API_URL=http://IP_BACKEND
# Ou https://api.printmonitor.com.br com domínio
EOF

# Build
npm run build

# Comprimir
tar -czf dist.tar.gz dist/
```

### 2. Enviar para Servidor

```bash
scp dist.tar.gz root@IP_FRONTEND:/root/
```

**No servidor**:
```bash
cd /root
mkdir -p /var/www/printmonitor-frontend
tar -xzf dist.tar.gz -C /var/www/printmonitor-frontend --strip-components=1
```

### 3. Configurar Nginx

```bash
cat > /etc/nginx/sites-available/printmonitor-frontend << 'EOF'
server {
    listen 80;
    server_name IP_FRONTEND;  # Ou app.printmonitor.com.br

    root /var/www/printmonitor-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip
    gzip on;
    gzip_types text/css application/javascript image/svg+xml;
}
EOF

# Ativar
ln -s /etc/nginx/sites-available/printmonitor-frontend /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 4. Testar

Abrir navegador: `http://IP_FRONTEND`

---

## Configurar SSL (HTTPS)

### Backend

```bash
# No servidor backend
certbot --nginx -d api.printmonitor.com.br

# Auto-renovação
certbot renew --dry-run
```

### Frontend

```bash
# No servidor frontend
certbot --nginx -d app.printmonitor.com.br

# Forçar HTTPS
# Certbot já adiciona redirect automático
```

---

## Configurar Domínio (Opcional)

**Registro.br ou Registro Global Magalu**:

1. Comprar domínio: `printmonitor.com.br`

2. Configurar DNS:
```
Tipo  | Nome | Valor
------|------|-------
A     | @    | IP_FRONTEND
A     | app  | IP_FRONTEND
A     | api  | IP_BACKEND
```

3. Aguardar propagação (até 24h)

4. Reconfigurar Nginx com domínios reais

---

## Database Setup

### 1. Acessar Database

```bash
# Do servidor backend ou via túnel SSH
psql postgresql://admin:PASSWORD@xxx.postgres.magalu.cloud:5432/printmonitor
```

### 2. Criar Schema

```sql
-- Executar schema do plano original
CREATE TABLE clients (...);
CREATE TABLE agents (...);
CREATE TABLE devices (...);
-- etc
```

**Ou usar Prisma**:

```bash
# No backend
npm install prisma @prisma/client

# Gerar schema
npx prisma init

# Editar prisma/schema.prisma
# Executar migration
npx prisma migrate deploy
```

---

## Instalar Agente Local

**No servidor da empresa** (onde estão as impressoras):

### Windows

```powershell
# Download (criar release no GitHub)
wget https://github.com/seu-repo/releases/printmonitor-agent-win.exe

# Instalar
.\printmonitor-agent-win.exe install

# Configurar
notepad C:\ProgramData\PrintMonitor\config.json
```

```json
{
  "apiUrl": "http://IP_BACKEND",
  "apiKey": "sk_live_xxxxx",
  "syncInterval": 300000,
  "networkPrefix": "192.168.1",
  "ipStart": 1,
  "ipEnd": 254
}
```

```powershell
# Iniciar serviço
net start PrintMonitorAgent
```

### Linux

```bash
# Download
wget https://github.com/seu-repo/releases/printmonitor-agent-linux

# Instalar
chmod +x printmonitor-agent-linux
sudo mv printmonitor-agent-linux /usr/local/bin/printmonitor-agent

# Configurar
sudo nano /etc/printmonitor/config.json

# Criar serviço systemd
sudo nano /etc/systemd/system/printmonitor-agent.service
```

```ini
[Unit]
Description=PrintMonitor Agent
After=network.target

[Service]
Type=simple
User=printmonitor
ExecStart=/usr/local/bin/printmonitor-agent
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable printmonitor-agent
sudo systemctl start printmonitor-agent
sudo systemctl status printmonitor-agent
```

---

## Monitoramento

### Logs Backend

```bash
# Via PM2
pm2 logs printmonitor-api

# Ou arquivo
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Health Check Automático

**Criar script de monitoramento**:

```bash
# /root/health-check.sh
#!/bin/bash

BACKEND="http://IP_BACKEND/health"
FRONTEND="http://IP_FRONTEND"

# Check backend
if ! curl -sf $BACKEND > /dev/null; then
    echo "Backend DOWN!" | mail -s "AlertaPrintMonitor" seu@email.com
    pm2 restart printmonitor-api
fi

# Check frontend
if ! curl -sf $FRONTEND > /dev/null; then
    echo "Frontend DOWN!" | mail -s "Alerta PrintMonitor" seu@email.com
    systemctl restart nginx
fi
```

**Agendar com cron**:
```bash
crontab -e

# A cada 5 minutos
*/5 * * * * /root/health-check.sh
```

---

## Backup Automático

### Database (via Magalu Cloud)

Já configurado automaticamente no painel:
- Backups diários
- Retenção: 7 dias
- Restore via painel

### Código (manual)

```bash
# Criar backup
cd /var/www/printmonitor-backend
tar -czf /root/backups/backend-$(date +\%Y\%m\%d).tar.gz *

# Cleanup backups antigos (manter 7 dias)
find /root/backups -name "backend-*.tar.gz" -mtime +7 -delete
```

---

## Atualização da Aplicação

### Backend

```bash
# Fazer upload nova versão
scp backend.tar.gz root@IP_BACKEND:/root/

# No servidor
cd /var/www/printmonitor-backend
tar -xzf /root/backend.tar.gz
npm install --production
pm2 restart printmonitor-api
```

### Frontend

```bash
# Build local
npm run build
tar -czf dist.tar.gz dist/

# Upload
scp dist.tar.gz root@IP_FRONTEND:/root/

# No servidor
cd /var/www/printmonitor-frontend
rm -rf *
tar -xzf /root/dist.tar.gz --strip-components=1
# Não precisa restart, Nginx serve arquivos estáticos
```

---

## Troubleshooting

### Backend não responde

```bash
pm2 status
pm2 logs printmonitor-api --lines 100

# Restart
pm2 restart printmonitor-api

# Se persistir
systemctl status nginx
systemctl restart nginx
```

### Database connection failed

```bash
# Testar conexão
psql postgresql://admin:PASSWORD@xxx.postgres.magalu.cloud:5432/printmonitor

# Verificar firewall Magalu Cloud
# No painel: Database > Network > Allowed IPs
# Adicionar IP do backend
```

### Frontend erro 502

```bash
# Verificar Nginx
nginx -t
systemctl status nginx

# Verificar proxy
curl http://localhost:3000/health
```

---

## Checklist de Go-Live

- [ ] VPS Backend criada e configurada
- [ ] VPS Frontend criada e configurada
- [ ] Database criado e schema aplicado
- [ ] Backend deployado e rodando (PM2)
- [ ] Frontend deployado
- [ ] SSL configurado (HTTPS)
- [ ] Domínio apontado (se aplicável)
- [ ] Agente local instalado e sincronizando
- [ ] Teste end-to-end completo
- [ ] Backup automático configurado
- [ ] Monitoramento ativo
- [ ] Documentação atualizada
- [ ] Usuários treinados

---

## Custos Finais

**Setup Inicial**: R$ 0 (sem taxa de setup)
**Mensal (3 usuários)**: R$ 107,83
**Anual**: R$ 1.293,96

**Comparado com AWS**: ~60% mais barato
**Suporte**: Em português, horário comercial

---

## Próximos Passos

1. Criar conta Magalu Cloud
2. Provisionar VPS Backend
3. Provisionar Database
4. Provisionar VPS Frontend
5. Seguir este guia passo a passo
6. Testar com 1 cliente piloto
7. Escalar conforme necessário

**Estimativa total de setup**: 1 dia de trabalho
