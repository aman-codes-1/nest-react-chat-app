import { MessageData } from '../contexts';
import { deleteKeyValuePairs } from '../helpers';

export class MessageQueueService {
  private createChat: any;
  private createMessage: any;
  private setMessageGroups: any;
  private setLoadingProcessNextMessage: any;

  constructor(
    createChatMutation?: any,
    createMessageMutation?: any,
    setChatMessageGroups?: any,
    setLoadingProcessMessage?: any,
  ) {
    this.createChat = createChatMutation || null;
    this.createMessage = createMessageMutation || null;
    this.setMessageGroups = setChatMessageGroups || null;
    this.setLoadingProcessNextMessage = setLoadingProcessMessage || null;
  }

  openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('messageQueueDatabase', 1);

      if (request) {
        request.onupgradeneeded = (event: any) => {
          const db = event?.target?.result;
          if (!db.objectStoreNames.contains('messageQueueStore')) {
            const objectStore = db.createObjectStore('messageQueueStore', {
              keyPath: 'queueId',
            });
            objectStore.createIndex('chatId', 'chatId', { unique: false });
            objectStore.createIndex('timestamp', 'timestamp', {
              unique: false,
            });
            objectStore.createIndex(
              'chatId_timestamp',
              ['chatId', 'timestamp'],
              { unique: false },
            );
            objectStore.createIndex(
              'friendId_timestamp',
              ['friendId', 'timestamp'],
              { unique: false },
            );
          }
        };

        request.onsuccess = (event: any) => {
          resolve(event?.target?.result);
        };

        request.onerror = (event: any) => {
          reject(`Error opening database: ${event?.target?.errorCode}`);
        };
      }
    });
  }

  async addMessageToQueue(messageData: MessageData) {
    const db: any = await this.openDatabase();

    if (db) {
      return new Promise<MessageData>((resolve, reject) => {
        const transaction = db?.transaction?.('messageQueueStore', 'readwrite');

        if (transaction) {
          const objectStore = transaction?.objectStore?.('messageQueueStore');

          if (objectStore) {
            const messageDataCopy = { ...messageData };
            if (!messageDataCopy?.queueId) {
              messageDataCopy.queueId = crypto.randomUUID();
            }

            const request = objectStore?.add?.(messageData);

            if (request) {
              request.onsuccess = (event: any) => {
                const queueId = event?.target?.result;
                messageDataCopy.queueId = queueId || '';
                resolve(messageDataCopy);
              };

              request.onerror = () => {
                reject('Error retrieving chat');
              };
            }
          }
        }
      });
    }
  }

  async updateMessageToQueue(queueId: string, obj: any, keysToDelete?: any[]) {
    const db: any = await this.openDatabase();

    if (db) {
      return new Promise<MessageData | null>((resolve, reject) => {
        const transaction = db?.transaction?.('messageQueueStore', 'readwrite');

        if (transaction) {
          const objectStore = transaction?.objectStore?.('messageQueueStore');

          if (objectStore) {
            const request = objectStore?.get?.(queueId);

            if (request) {
              request.onsuccess = (event: any) => {
                const messageData = event?.target?.result;
                if (messageData) {
                  let messageDataCopy = { ...messageData };
                  messageDataCopy = keysToDelete
                    ? deleteKeyValuePairs(keysToDelete, messageDataCopy)
                    : messageDataCopy;

                  Object.keys(obj || {}).forEach((key) => {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                      messageDataCopy[key] = obj[key];
                    }
                  });

                  const updateRequest = objectStore?.put?.(messageDataCopy);
                  if (updateRequest) {
                    updateRequest.onsuccess = () => {
                      resolve(messageDataCopy);
                    };

                    updateRequest.onerror = () => {
                      reject('Error updating message');
                    };
                  }
                } else {
                  resolve(null);
                }
              };

              request.onerror = () => {
                reject('Error retrieving chat');
              };
            }
          }
        }
      });
    }
  }

  async deleteMessageFromQueue(queueId: string) {
    const db: any = await this.openDatabase();

    if (db) {
      return new Promise<boolean>((resolve, reject) => {
        const transaction = db?.transaction?.('messageQueueStore', 'readwrite');

        if (transaction) {
          const objectStore = transaction?.objectStore?.('messageQueueStore');

          if (objectStore) {
            const deleteRequest = objectStore?.delete?.(queueId);

            if (deleteRequest) {
              deleteRequest.onsuccess = () => {
                resolve(true);
              };

              deleteRequest.onerror = () => {
                reject('Error deleting message');
              };
            }
          }
        }
      });
    }
  }

  async getQueuedMessageById(queueId: number | null) {
    // to do: implement cursor pagination
    const db: any = await this.openDatabase();

    if (db) {
      return new Promise<MessageData | null>((resolve, reject) => {
        const transaction = db?.transaction?.('messageQueueStore', 'readonly');

        if (transaction) {
          const objectStore = transaction?.objectStore?.('messageQueueStore');

          if (objectStore) {
            const request = objectStore?.get?.(queueId);

            if (request) {
              request.onsuccess = (event: any) => {
                const message = event?.target?.result;

                if (message) {
                  resolve(message);
                } else {
                  resolve(null);
                }
              };

              request.onerror = () => {
                reject('Error fetching message by ID');
              };
            }
          }
        }
      });
    }
  }

  async getQueuedMessagesById(
    id: string,
    key: string,
    limit: number,
    offset: number,
  ) {
    const db: any = await this.openDatabase();

    if (db) {
      return new Promise<any>((resolve, reject) => {
        const transaction = db?.transaction?.('messageQueueStore', 'readonly');

        if (transaction) {
          const objectStore = transaction?.objectStore?.('messageQueueStore');

          if (objectStore) {
            const index = objectStore?.index?.(`${key}_timestamp`);

            if (index) {
              const lowerBound = [id, -Infinity]; //
              const upperBound = [id, Infinity]; //
              const range = IDBKeyRange.bound(lowerBound, upperBound);

              const request = index?.openCursor?.(range, 'next');

              if (request) {
                const messages: any[] = [];
                let count = 0;

                request.onsuccess = (event: any) => {
                  const cursor = event?.target?.result;

                  if (!cursor) {
                    resolve(messages);
                    return;
                  }

                  if (count >= offset && messages?.length < limit) {
                    messages?.push?.(cursor?.value);
                  }

                  count++;

                  if (messages?.length < limit) {
                    cursor?.continue?.();
                  } else {
                    resolve(messages);
                  }
                };

                request.onerror = () => {
                  reject('Error fetching paginated messages');
                };
              }
            }
          }
        }
      });
    }
  }

  async getNextQueuedMessage(offset: number) {
    const db: any = await this.openDatabase();

    if (db) {
      return new Promise<any | null>((resolve, reject) => {
        const transaction = db?.transaction?.('messageQueueStore', 'readonly');

        if (transaction) {
          const objectStore = transaction?.objectStore?.('messageQueueStore');

          if (objectStore) {
            const index = objectStore.index('timestamp');

            if (index) {
              const request = index?.openCursor?.();

              if (request) {
                let count = 0;

                request.onsuccess = (event: any) => {
                  const cursor = event?.target?.result;

                  if (!cursor) {
                    resolve(null);
                    return;
                  }

                  if (offset === 1 && count === 0) {
                    resolve(null);
                    return;
                  }

                  if (count === offset) {
                    const message = cursor?.value;
                    resolve({ message, cursor });
                  } else {
                    count++;
                    cursor?.continue?.();
                  }
                };

                request.onerror = () => {
                  reject('Error fetching message by offset');
                };
              }
            }
          }
        }
      });
    }
  }

  async removeCursorFromQueueAndRestart(cursor: any) {
    await cursor?.delete?.();
    return this.processNextMessage(0);
  }

  async removeFromQueueAndRestart(queueId: string) {
    await this.deleteMessageFromQueue(queueId);

    this.setMessageGroups?.((prevGroup: any) => {
      if (!prevGroup?.length) return prevGroup;

      const updatedGroups = prevGroup?.map((group: any) => {
        const index = group?.data?.findIndex(
          (item: any) => item?.queueId === queueId,
        );

        if (index < 0) return group;

        const dataCopy = group.data.filter((_: any, i: number) => i !== index);

        return {
          ...group,
          data: dataCopy,
        };
      });

      return updatedGroups;
    });

    return this.processNextMessage(0);
  }

  async shouldRetryAndProcessNext(
    queueId: string,
    retryCount: number,
    isRetry: boolean,
    offset: number,
  ) {
    if (retryCount < 2) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return this.processNextMessage(retryCount + 1, offset);
    }

    if (!isRetry) {
      await this.updateMessageToQueue(queueId, { isRetry: true });
    }

    return this.processNextMessage(0, offset + 1);
  }

  async createChatAndUpdateToQueue(
    userId: string,
    queueId: string,
    friendId: string,
    friendUserId: string,
    retryCount: number,
    isRetry: boolean,
    offset: number,
  ) {
    const createdChat = await this.createChat?.({
      variables: {
        userId,
        friendId,
        queueId,
        type: 'private',
        friendUserId,
      },
    });

    const createdChatData = createdChat?.data?.createChat;
    const createdChatId = createdChatData?._id;
    if (!createdChatId)
      await this.shouldRetryAndProcessNext(
        queueId,
        retryCount,
        isRetry,
        offset,
      );

    await this.updateMessageToQueue(queueId, {
      chatId: createdChatId,
    });

    return createdChatId;
  }

  async createMessageAndProcessNext(
    userId: string,
    queueId: string,
    chatId: string,
    rest: any,
    retryCount: number,
    isRetry: boolean,
    offset: number,
  ) {
    const createdMessage = await this.createMessage?.({
      variables: {
        ...rest,
        userId,
        chatId,
        queueId,
      },
    });

    const createdMessageData = createdMessage?.data?.createMessage;
    const createdMessageId = createdMessageData?._id;
    if (!createdMessageId)
      await this.shouldRetryAndProcessNext(
        queueId,
        retryCount,
        isRetry,
        offset,
      );
  }

  async getNextMessageForProcessing(offset: number): Promise<any> {
    const data = await this.getNextQueuedMessage(offset);
    return data;
  }

  async processNextMessage(retryCount = 0, offset = 0): Promise<void> {
    const { message, cursor } =
      (await this.getNextMessageForProcessing(offset)) || {};

    if (!message) return;

    const { queueId, sender, chatId, friendId, friendUserId, ...rest } =
      message || {};

    if (!queueId) await this.removeCursorFromQueueAndRestart(cursor);

    const userId = sender?._id;
    const isRetry = sender?.sentStatus?.isRetry || false;

    let chatIdToUse = chatId || '';

    this.setLoadingProcessNextMessage(true);

    try {
      if (!chatIdToUse && friendId && friendUserId) {
        chatIdToUse = await this.createChatAndUpdateToQueue(
          userId,
          queueId,
          friendId,
          friendUserId,
          retryCount,
          isRetry,
          offset,
        );
      }

      if (chatIdToUse) {
        await this.createMessageAndProcessNext(
          userId,
          queueId,
          chatIdToUse,
          rest,
          retryCount,
          isRetry,
          offset,
        );

        await this.removeFromQueueAndRestart(queueId);
      }

      await this.shouldRetryAndProcessNext(
        queueId,
        retryCount,
        isRetry,
        offset,
      );
    } catch (error: any) {
      const errorMessage = error?.message || '';
      const isDuplicateRecordFound = errorMessage?.includes?.('Duplicate');
      const isChatNotFoundError = errorMessage?.includes?.('Chat not found');

      if (isDuplicateRecordFound || isChatNotFoundError) {
        await this.removeFromQueueAndRestart(queueId);
      }

      await this.shouldRetryAndProcessNext(
        queueId,
        retryCount,
        isRetry,
        offset,
      );
    } finally {
      this.setLoadingProcessNextMessage(false);
    }
  }

  async processQueue() {
    await this.processNextMessage();
  }
}
