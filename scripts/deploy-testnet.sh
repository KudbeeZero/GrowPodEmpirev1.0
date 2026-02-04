#!/bin/bash
# GrowPod Empire - TestNet Deployment Script with Admin Wallet
# This script deploys the smart contract to Algorand TestNet

set -e  # Exit on error

echo "============================================================"
echo "GrowPod Empire - TestNet Deployment"
echo "============================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Admin wallet information (TestNet only)
ADMIN_WALLET_ADDRESS="BDBJFOSYG4N3LHLJN3CHLOLYDGW63SK6YJHECGDYMF75DXL4X3XCQNDLME"
ADMIN_MNEMONIC="wheat spread skull erosion actual patient noble abstract valve switch fire bottom ceiling coral visa connect marine accident forum kite finger energy convince above small"

echo -e "${YELLOW}⚠️  WARNING: This script is for TestNet deployment only!${NC}"
echo -e "${YELLOW}⚠️  Network: Algorand TestNet (Chain ID: 416002)${NC}"
echo -e "${YELLOW}⚠️  Admin Wallet: $ADMIN_WALLET_ADDRESS${NC}"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    exit 1
fi

# Check if required Python packages are installed
echo "Checking Python dependencies..."
python3 -c "import algosdk; import pyteal" 2>/dev/null || {
    echo -e "${YELLOW}Installing required Python packages...${NC}"
    pip install py-algorand-sdk pyteal
}

echo -e "${GREEN}✅ Python dependencies OK${NC}"
echo ""

# Verify we're in the correct directory
if [ ! -d "contracts" ]; then
    echo -e "${RED}❌ Error: contracts directory not found${NC}"
    echo "Please run this script from the repository root"
    exit 1
fi

# Step 1: Compile the contract
echo "============================================================"
echo "Step 1: Compiling Smart Contract"
echo "============================================================"
cd contracts
python3 contract.py
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Contract compiled successfully${NC}"
else
    echo -e "${RED}❌ Contract compilation failed${NC}"
    exit 1
fi
cd ..
echo ""

# Step 2: Deploy to TestNet
echo "============================================================"
echo "Step 2: Deploying to Algorand TestNet"
echo "============================================================"
echo ""
echo "This will:"
echo "  1. Deploy the smart contract"
echo "  2. Fund the contract address"
echo "  3. Bootstrap \$BUD, \$TERP, and Slot tokens"
echo "  4. Output environment variables"
echo ""
echo -e "${YELLOW}Note: You need at least 2 ALGO in the admin wallet for deployment${NC}"
echo -e "${YELLOW}Get TestNet ALGO from: https://bank.testnet.algorand.network/${NC}"
echo ""

read -p "Press Enter to continue with deployment or Ctrl+C to cancel..."

cd contracts
ALGO_MNEMONIC="$ADMIN_MNEMONIC" python3 deploy.py

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}============================================================${NC}"
    echo -e "${GREEN}✅ Deployment Successful!${NC}"
    echo -e "${GREEN}============================================================${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Copy the environment variables above"
    echo "  2. Update .dev.vars for local development"
    echo "  3. Update .replit for Replit environment"
    echo "  4. Configure Cloudflare secrets for production"
    echo "  5. Restart your application"
    echo ""
    echo "See ADMIN_WALLET_DEPLOYMENT.md for detailed instructions"
else
    echo ""
    echo -e "${RED}============================================================${NC}"
    echo -e "${RED}❌ Deployment Failed${NC}"
    echo -e "${RED}============================================================${NC}"
    echo ""
    echo "Common issues:"
    echo "  - Insufficient funds (need 2+ ALGO in admin wallet)"
    echo "  - Network connectivity issues"
    echo "  - TestNet API temporarily unavailable"
    echo ""
    echo "Check the error message above for details"
    exit 1
fi

cd ..
