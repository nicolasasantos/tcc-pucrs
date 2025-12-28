export class Report {
  _id!: string;
  category!: {
    _id: string;
    name: string;
  };
  title!: string;
  description!: string;
  image!: string;
  location!: {
    latitude: number;
    longitude: number;
  };
  name!: string;
  email?: string;
  vote_fix!: number;
  severity!: string;
  created_at!: Date;
  updated_at?: Date;
}
