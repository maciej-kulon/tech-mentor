export interface ICommonUser {
  id: string;
  name: string;
  surname: string;
  email: string;
  company?: string;
  createdAt: Date;
  updatedAt: Date;
}
