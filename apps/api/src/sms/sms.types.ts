export interface KavenegarReturn {
  status: number;
  message: string;
}

export interface KavenegarEntry {
  messageid: number;
  message: string;
  status: number;
  statustext: string;
  sender: string;
  receptor: string;
  date: number;
  cost: number;
}

export interface KavenegarResponse {
  return: KavenegarReturn;
  entries?: KavenegarEntry[];
}

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}

export interface SmsTemplateOptions {
  receptor: string;
  template: string;
  token: string;
  token2?: string;
  token3?: string;
  token10?: string;
  token20?: string;
}
