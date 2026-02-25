export type VercelRequest = {
  method?: string;
  body: any;
  [key: string]: any;
};

export type VercelResponse = {
  setHeader: (name: string, value: string) => void;
  status: (statusCode: number) => VercelResponse;
  json: (jsonBody: any) => VercelResponse;
  end: () => void;
  [key: string]: any;
};
