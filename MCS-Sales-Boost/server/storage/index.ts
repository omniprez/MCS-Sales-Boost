interface Storage {
  getDeals(): Promise<Deal[]>;
}

interface Deal {
  id: string;
  mrc: number;
  nrc: number;
  contractLength: number;
  stage: string;
  createdAt: string;
  customerId?: string;
  category?: string;
  clientType?: string;
} 