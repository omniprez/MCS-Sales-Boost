export interface User {
  id: number;
  username: string;
  password?: string;
  role?: string;
  teamId?: number;
  name?: string;
  email?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Deal {
  id: number;
  title?: string;
  value?: number;
  status?: string;
  customerId?: number;
  userId?: number;
  category?: string;
  clientType?: string;
  mrc?: number;
  nrc?: number;
  tcv?: number;
  contractLength?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Target {
  id: number;
  userId: number;
  targetAmount: number;
  startDate: Date;
  endDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
} 