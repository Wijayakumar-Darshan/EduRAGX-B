const { ethers } = require('ethers');
const crypto     = require('crypto');
const fs         = require('fs');
const path       = require('path');

// Load ABI
let CONTRACT_ABI = [];
const abiPath = path.join(__dirname, '../../../blockchain/abi/AcademicRecord.json');
if (fs.existsSync(abiPath)) {
  CONTRACT_ABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
} else {
  CONTRACT_ABI = [
    'function addRecord(string studentId, string reportHash, string reportType) returns (uint256)',
    'function verifyRecordView(uint256 recordId, string hashToCheck) view returns (bool)',
    'function getRecord(uint256 recordId) view returns (string,string,string,uint256,address,bool)',
    'function getStudentRecordIds(string studentId) view returns (uint256[])',
    'function totalRecords() view returns (uint256)',
    'event RecordAdded(uint256 indexed recordId, string indexed studentId, string reportHash, uint256 timestamp, address issuer)',
  ];
}

const RPC_URL       = process.env.SEPOLIA_RPC_URL      || '';
const PRIVATE_KEY   = process.env.DEPLOYER_PRIVATE_KEY || '';
const CONTRACT_ADDR = process.env.BLOCKCHAIN_CONTRACT_ADDRESS || '';
const MOCK_MODE     = !RPC_URL || !PRIVATE_KEY || !CONTRACT_ADDR;

if (MOCK_MODE) {
  console.warn('[Blockchain] Running in MOCK mode — set SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY, BLOCKCHAIN_CONTRACT_ADDRESS to go live');
}

let _provider=null, _signer=null, _contract=null;

function getContract() {
  if (MOCK_MODE) return null;
  if (_contract)  return _contract;
  try {
    _provider = new ethers.JsonRpcProvider(RPC_URL);
    _signer   = new ethers.Wallet(PRIVATE_KEY, _provider);
    _contract = new ethers.Contract(CONTRACT_ADDR, CONTRACT_ABI, _signer);
    return _contract;
  } catch (e) { console.error('[Blockchain] Connect failed:', e.message); return null; }
}

const hashContent = (content) => {
  const buf = Buffer.isBuffer(content) ? content : Buffer.from(String(content), 'utf8');
  return crypto.createHash('sha256').update(buf).digest('hex');
};

// Mock store
const _mockStore = [];
let   _mockId    = 1;

async function anchorReport(studentId, pdfContent, reportType='YEAR_END') {
  const reportHash = hashContent(pdfContent);
  if (MOCK_MODE) {
    const id = _mockId++;
    _mockStore.push({ id, studentId:String(studentId), reportHash, reportType, issuedAt:Date.now(), revoked:false });
    return { blockchainRecordId:id, txHash:`0xMOCK_${id}`, blockNumber:0, reportHash, mock:true };
  }
  const contract = getContract();
  if (!contract) throw new Error('Blockchain contract unavailable');
  try {
    const tx      = await contract.addRecord(String(studentId), reportHash, reportType);
    const receipt = await tx.wait();
    const event   = receipt.logs.map(log => { try { return contract.interface.parseLog(log); } catch { return null; } }).find(e => e?.name==='RecordAdded');
    return { blockchainRecordId: event?Number(event.args.recordId):null, txHash:receipt.hash, blockNumber:receipt.blockNumber, reportHash, mock:false };
  } catch (e) { throw new Error('Blockchain transaction failed: ' + e.message); }
}

async function verifyReport(recordId, pdfContent) {
  const hashToCheck = hashContent(pdfContent);
  if (MOCK_MODE) {
    const r = _mockStore.find(r => r.id===Number(recordId));
    if (!r) return { verified:false, error:'Record not found', reportHash:hashToCheck, mock:true };
    return { verified:!r.revoked && r.reportHash===hashToCheck, reportHash:hashToCheck, record:r, mock:true };
  }
  const contract = getContract();
  if (!contract) throw new Error('Blockchain contract unavailable');
  try {
    const verified = await contract.verifyRecordView(Number(recordId), hashToCheck);
    const [sid, storedHash, rtype, ts, issuer, revoked] = await contract.getRecord(Number(recordId));
    return { verified, reportHash:hashToCheck, record:{ studentId:sid, reportHash:storedHash, reportType:rtype, issuedAt:Number(ts)*1000, issuer, revoked }, mock:false };
  } catch (e) { throw new Error('Blockchain verification failed: ' + e.message); }
}

async function getStudentRecords(studentId) {
  if (MOCK_MODE) return { records:_mockStore.filter(r=>r.studentId===String(studentId)), mock:true };
  const contract = getContract();
  if (!contract) throw new Error('Blockchain contract unavailable');
  try {
    const ids = await contract.getStudentRecordIds(String(studentId));
    const records = await Promise.all(ids.map(async id => {
      const [sid,hash,rtype,ts,issuer,revoked] = await contract.getRecord(id);
      return { id:Number(id), studentId:sid, reportHash:hash, reportType:rtype, issuedAt:Number(ts)*1000, issuer, revoked };
    }));
    return { records, mock:false };
  } catch (e) { throw new Error('Failed to fetch blockchain records: ' + e.message); }
}

async function getStatus() {
  if (MOCK_MODE) return { live:false, mock:true, mockRecords:_mockStore.length, contractAddress:'MOCK_MODE', network:'mock' };
  try {
    const contract = getContract();
    const total    = await contract.totalRecords();
    const network  = await _provider.getNetwork();
    return { live:true, mock:false, contractAddress:CONTRACT_ADDR, network:network.name, chainId:Number(network.chainId), totalRecords:Number(total) };
  } catch (e) { return { live:false, mock:false, error:e.message, contractAddress:CONTRACT_ADDR }; }
}

module.exports = { anchorReport, verifyReport, getStudentRecords, getStatus, hashContent };
