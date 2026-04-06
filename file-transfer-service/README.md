# P2P File Transfer Service

A fully functional peer-to-peer file transfer microservice with WebSocket support for real-time communication and signaling.

## Features

- Peer registration and discovery
- Real-time peer status updates via WebSocket
- Chunked file upload/download (1MB chunks)
- Transfer progress tracking
- File metadata management
- WebRTC signaling support for direct P2P connections
- Transfer accept/reject workflow
- SHA-256 checksum verification
- Multi-peer support

## Architecture

### Components

1. **Peer Management**: Register, discover, and manage peer connections
2. **File Transfer**: Chunked file upload/download with progress tracking
3. **WebSocket Signaling**: Real-time communication for WebRTC setup
4. **Metadata Storage**: Track all file transfers and their status

### Database Schema

- `peers`: Store peer information and status
- `file_metadata`: Track file transfer metadata
- `file_chunks`: Store file chunks with checksums

## API Endpoints

### Peer Management

```bash
# Register a new peer
POST /api/peers/register
{
  "username": "user1",
  "ipAddress": "192.168.1.100",
  "port": 9000
}

# Get online peers
GET /api/peers/online

# Get all peers
GET /api/peers

# Update peer status
PUT /api/peers/{peerId}/status?status=ONLINE

# Disconnect peer
POST /api/peers/{peerId}/disconnect
```

### File Transfer

```bash
# Initiate a file transfer
POST /api/transfers/initiate
{
  "fileName": "document.pdf",
  "fileSize": 1048576,
  "fileType": "application/pdf",
  "senderPeerId": "peer-id-1",
  "receiverPeerId": "peer-id-2"
}

# Upload a file chunk
POST /api/transfers/upload-chunk
  ?fileId=file-uuid
  &chunkNumber=1
  &totalChunks=10
  &file=<binary-data>

# Accept transfer
POST /api/transfers/{fileId}/accept

# Reject transfer
POST /api/transfers/{fileId}/reject

# Download file
GET /api/transfers/download/{fileId}

# Get transfer status
GET /api/transfers/status/{fileId}

# Get transfers by sender
GET /api/transfers/sender/{peerId}

# Get transfers by receiver
GET /api/transfers/receiver/{peerId}
```

## WebSocket Topics

### Subscribe to:

- `/topic/peers` - Receive peer list updates
- `/topic/transfer-progress-{fileId}` - Receive transfer progress updates
- `/topic/chunk-received-{fileId}` - Receive chunk confirmation
- `/queue/transfer-request-{peerId}` - Receive incoming transfer requests
- `/queue/transfer-accepted-{peerId}` - Receive transfer acceptance
- `/queue/transfer-rejected-{peerId}` - Receive transfer rejection
- `/queue/signal-{peerId}` - Receive WebRTC signaling messages

### Send to:

- `/app/signal` - Send WebRTC signaling messages
- `/app/heartbeat` - Send heartbeat to maintain connection

## Usage Example

### 1. Connect to WebSocket

```javascript
const socket = new SockJS('http://localhost:8083/ws');
const stompClient = Stomp.over(socket);

stompClient.connect({}, function(frame) {
    console.log('Connected: ' + frame);
    
    // Subscribe to peer updates
    stompClient.subscribe('/topic/peers', function(message) {
        const peers = JSON.parse(message.body);
        console.log('Online peers:', peers);
    });
});
```

### 2. Register as Peer

```javascript
fetch('http://localhost:8083/api/peers/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        username: 'Alice',
        ipAddress: '192.168.1.100',
        port: 9000
    })
})
.then(res => res.json())
.then(peer => {
    console.log('Registered as:', peer);
    myPeerId = peer.peerId;
});
```

### 3. Initiate File Transfer

```javascript
// Subscribe to transfer requests
stompClient.subscribe('/queue/transfer-request-' + myPeerId, function(message) {
    const transfer = JSON.parse(message.body);
    console.log('Incoming transfer:', transfer);
    
    // Accept or reject
    if (confirm('Accept file: ' + transfer.fileName + '?')) {
        acceptTransfer(transfer.fileId);
    } else {
        rejectTransfer(transfer.fileId);
    }
});

// Initiate transfer
fetch('http://localhost:8083/api/transfers/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        fileName: 'document.pdf',
        fileSize: file.size,
        fileType: file.type,
        senderPeerId: myPeerId,
        receiverPeerId: targetPeerId
    })
})
.then(res => res.json())
.then(metadata => {
    console.log('Transfer initiated:', metadata);
    uploadFileInChunks(file, metadata.fileId);
});
```

### 4. Upload File in Chunks

```javascript
async function uploadFileInChunks(file, fileId) {
    const CHUNK_SIZE = 1048576; // 1MB
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    
    for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        
        const formData = new FormData();
        formData.append('file', chunk);
        formData.append('fileId', fileId);
        formData.append('chunkNumber', i);
        formData.append('totalChunks', totalChunks);
        
        await fetch('http://localhost:8083/api/transfers/upload-chunk', {
            method: 'POST',
            body: formData
        });
        
        console.log(`Uploaded chunk ${i + 1}/${totalChunks}`);
    }
}
```

### 5. Monitor Progress

```javascript
stompClient.subscribe('/topic/transfer-progress-' + fileId, function(message) {
    const progress = JSON.parse(message.body);
    console.log('Progress:', progress.progress + '%');
    
    if (progress.status === 'COMPLETED') {
        console.log('Transfer completed!');
    }
});
```

## Configuration

Edit `application.yml` to customize:

```yaml
file-transfer:
  chunk-size: 1048576  # Chunk size in bytes (1MB)
  storage-path: ./uploads  # File storage location
```

## Running the Service

```bash
# Build
mvn clean install

# Run
mvn spring-boot:run

# Or via Docker
docker build -t file-transfer-service .
docker run -p 8083:8083 file-transfer-service
```

## Testing with cURL

```bash
# Register peer
curl -X POST http://localhost:8083/api/peers/register \
  -H "Content-Type: application/json" \
  -d '{"username":"Alice","ipAddress":"192.168.1.100","port":9000}'

# Get online peers
curl http://localhost:8083/api/peers/online

# Initiate transfer
curl -X POST http://localhost:8083/api/transfers/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "fileName":"test.txt",
    "fileSize":1024,
    "fileType":"text/plain",
    "senderPeerId":"peer-1",
    "receiverPeerId":"peer-2"
  }'

# Upload chunk
curl -X POST "http://localhost:8083/api/transfers/upload-chunk?fileId=file-uuid&chunkNumber=0&totalChunks=1" \
  -F "file=@test.txt"
```

## Security Considerations

For production use, consider adding:

- Authentication and authorization
- End-to-end encryption
- Rate limiting
- File size limits
- Virus scanning
- HTTPS/WSS only
- CORS configuration
- Input validation

## Port

Default port: 8083
