class TransactionManager {
  private activeTransactions: Map<string, { connectionName: string }> = new Map();

  startTransaction(id: string, connectionName: string) {
    this.activeTransactions.set(id, { connectionName });
    console.log(`Transaction ${id} started on connection: ${connectionName}.`);
  }

  endTransaction(id: string) {
    const transaction = this.activeTransactions.get(id);
    if (transaction) {
      console.log(`Transaction ${id} ended on connection: ${transaction.connectionName}.`);
      this.activeTransactions.delete(id);
    } else {
      console.log(`Transaction ${id} not found.`);
    }
  }

  isTransactionActive(id: string): boolean {
    return this.activeTransactions.has(id);
  }

  hasActiveTransactions(): boolean {
    return this.activeTransactions.size > 0;
  }

  isOnlyTransaction(id: string): boolean {
    return this.activeTransactions.size === 1 && this.activeTransactions.has(id);
  }

  getTransactionConnection(id: string): string | null {
    const transaction = this.activeTransactions.get(id);
    return transaction ? transaction.connectionName : null;
  }
}

const transactionManager = new TransactionManager();
export default transactionManager;
