#!/bin/bash
# B.A.L.I.K. Setup Script
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   B.A.L.I.K. — BulSU Lost Item Keeper       ║"
echo "║   Setup Script                               ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi
echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ npm install failed. Check your internet connection."
    exit 1
fi

echo ""
echo "✅ Dependencies installed!"

# Create .env if not exists
if [ ! -f ".env" ]; then
    cat > .env << EOF
PORT=3000
SESSION_SECRET=balik-secret-$(openssl rand -hex 12 2>/dev/null || echo "change-this-secret")

# Email config (optional — for OTP emails)
# MAIL_USER=your-gmail@gmail.com
# MAIL_PASS=your-gmail-app-password

# Mistral AI (optional — chatbot)
MISTRAL_API_KEY=w6wS2RXI8f2I1IjbDB9FEaTR1PWCFayq
AGENT_ID=ag_019c9025025775f792f2f5f444aec7b3
EOF
    echo "✅ Created .env file (edit it to configure email/AI)"
fi

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   Setup complete! Run: npm start             ║"
echo "║                                              ║"
echo "║   User Portal: http://localhost:3000/        ║"
echo "║   Admin Panel: http://localhost:3000/admin/  ║"
echo "║                                              ║"
echo "║   Default admin: admin / admin123            ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
