export type TransferData = {
  from: string;
  to: string;
  memo: string;
  amount: number;
};

export type MemoContentType = {
  content: string[];
  timestamp: string;
  signature: string;
};
