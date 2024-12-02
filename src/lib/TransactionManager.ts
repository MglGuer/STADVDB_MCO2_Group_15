
class TransactionManager {
  private activeTransactions: Set<string> = new Set();

  startTransaction(id: string) {
    this.activeTransactions.add(id);
    console.log(`Transaction ${id} started.`);
  }

  endTransaction(id: string) {
    this.activeTransactions.delete(id);
    console.log(`Transaction ${id} ended.`);
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
}

const transactionManager = new TransactionManager();
export default transactionManager;
