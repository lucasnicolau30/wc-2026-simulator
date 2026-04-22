let API_BASE_URL;

const isLocal =
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1';

if (isLocal){
    API_BASE_URL = 'http://localhost:8000';
} 
else {
    API_BASE_URL = `${location.protocol}//${location.host}`;
}
