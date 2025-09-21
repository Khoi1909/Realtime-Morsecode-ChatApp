# Morse Service

A microservice for morse code translation in the Realtime Morse Code Chat App.

## Features

- **Text to Morse Code**: Convert text to international morse code
- **Morse to Text**: Convert morse code back to readable text
- **Validation**: Validate morse code format and supported characters
- **Character Support**: Full international morse code character set
- **RESTful API**: Clean REST endpoints for all operations

## API Endpoints

### Translation
- `POST /morse/translate` - Universal translation endpoint
- `POST /morse/text-to-morse` - Convert text to morse
- `POST /morse/morse-to-text` - Convert morse to text

### Validation
- `GET /morse/validate/morse?morse=...` - Validate morse code format
- `GET /morse/validate/text?text=...` - Validate text for conversion

### Utility
- `GET /morse/characters` - Get supported characters list
- `GET /morse/health` - Health check

## Environment Variables

```bash
NODE_ENV=development
PORT=3007
MORSE_SERVICE_PORT=3007
MORSE_SERVICE_URL=http://localhost:3007
LOG_LEVEL=info
```

## Usage Examples

### Text to Morse
```bash
curl -X POST http://localhost:3007/morse/text-to-morse \
  -H "Content-Type: application/json" \
  -d '{"text": "HELLO WORLD"}'
```

### Morse to Text
```bash
curl -X POST http://localhost:3007/morse/morse-to-text \
  -H "Content-Type: application/json" \
  -d '{"morse": ".... . .-.. .-.. --- / .-- --- .-. .-.. -.."}'
```

### Universal Translation
```bash
curl -X POST http://localhost:3007/morse/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "SOS", "direction": "text-to-morse"}'
```

## Supported Characters

- **Letters**: A-Z (case insensitive)
- **Numbers**: 0-9
- **Punctuation**: . , ? ' ! / ( ) & : ; = + - _ " $ @
- **Space**: Represented as `/` in morse code

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Docker

```bash
# Build image
docker build -t morse-service .

# Run container
docker run -p 3007:3007 morse-service
```
