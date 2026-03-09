import { Peer, type DataConnection } from 'peerjs';
import { prepareSyncPayload, type SyncPayload } from './db';

const PEER_PREFIX = 'flo-cycle-';

export class P2PService {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;

  /**
   * Start acting as a receiver (wait for data)
   */
  async startReceiving(code: string, onData: (payload: SyncPayload) => void): Promise<string> {
    const peerId = `${PEER_PREFIX}${code.toUpperCase()}`;
    this.peer = new Peer(peerId);

    return new Promise((resolve, reject) => {
      this.peer!.on('open', (id) => {
        console.log('Receiver peer opened with ID:', id);
        resolve(id);
      });

      this.peer!.on('connection', (conn) => {
        this.connection = conn;
        conn.on('data', (data: any) => {
          if (data && typeof data === 'object' && 'profile' in data) {
            onData(data as SyncPayload);
          }
        });
      });

      this.peer!.on('error', (err) => {
        if (err.type === 'unavailable-id') {
          reject(new Error('This code is already in use. Try again.'));
        } else {
          reject(err);
        }
      });
    });
  }

  /**
   * Start acting as a sender (push data to code)
   */
  async sendData(targetCode: string): Promise<void> {
    const targetPeerId = `${PEER_PREFIX}${targetCode.toUpperCase()}`;
    const myId = `${PEER_PREFIX}sender-${Math.random().toString(36).slice(2, 7)}`;
    this.peer = new Peer(myId);

    return new Promise((resolve, reject) => {
      this.peer!.on('open', () => {
        const conn = this.peer!.connect(targetPeerId);
        conn.on('open', async () => {
          try {
            const payload = await prepareSyncPayload();
            conn.send(payload);
            // Give it a moment to send before closing
            setTimeout(() => {
              this.destroy();
              resolve();
            }, 1000);
          } catch (err) {
            reject(err);
          }
        });

        conn.on('error', () => {
          reject(new Error('Connection failed. Make sure the other device is waiting.'));
        });

        // Timeout if no connection in 15s
        setTimeout(() => {
          reject(new Error('Connection timed out.'));
        }, 15000);
      });

      this.peer!.on('error', reject);
    });
  }

  destroy() {
    if (this.connection) this.connection.close();
    if (this.peer) this.peer.destroy();
    this.peer = null;
    this.connection = null;
  }
}

export const p2pService = new P2PService();
