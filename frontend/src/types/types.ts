export type lostItem = {
  id: string;
  img: string;
  userId: string;
  categoryId: string;
  lostItemName: string;
  description: string;
  date: string;
  location: string;
  createdAt: Date;
  isFound: boolean;
  updatedAt: Date;
};

export type foundItem = {
  id: string;
  img: string;
  userId: string;
  categoryId: string;
  foundItemName: string;
  description: string;
  date: string;
  location: string;
  claimProcess: string;
  isClaimed: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: { username: string; email: string };
};

export type modals = {
  message: string;
  status: boolean;
};

export type decodedUser = {
  role: Role;
  id: string;
  email: string;
};

export type Role = "ADMIN" | "USER";

export type ClaimStatus =
  | "PENDING"
  | "APPROVED"
  | "ACCEPTED"
  | "REJECTED";

export type ClaimEvent = {
  id: string;
  claimId: string;
  status: ClaimStatus;
  note?: string;
  createdAt: string;
  actor?: string;
};

export type Claim = {
  id: string;
  status: ClaimStatus;
  createdAt: string;
  updatedAt: string;
  foundItem: foundItem;
  events?: ClaimEvent[];
  user?: { username: string; email: string };
};