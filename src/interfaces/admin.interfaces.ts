import { IUser } from "./auth.interfaces";

export interface IAdmin extends IUser {
  permissions: {
    manageEvents: boolean;
    manageUsers: boolean;
    manageTickets: boolean;
    manageVenues: boolean;
    financialReports: boolean;
    contentModeration: boolean;
    systemSettings: boolean;
  };
}

export interface IEvent {
  id: number;
  name: string;
  description: string;
  venueId: number;
  date: Date;
  ticketTypes: ITicketType[];
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
}

export interface ITicketType {
  id: number;
  name: string;
  price: number;
  quantity: number;
  sold: number;
  validFrom: Date;
  validUntil: Date;
}

export interface IVenue {
  id: number;
  name: string;
  address: string;
  capacity: number;
  sections: ISection[];
}

export interface ISection {
  id: number;
  name: string;
  capacity: number;
  rows: IRow[];
}

export interface IRow {
  id: number;
  name: string;
  seats: ISeat[];
}

export interface ISeat {
  id: number;
  number: string;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
}