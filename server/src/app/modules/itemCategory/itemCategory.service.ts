import { ItemCategory } from "@prisma/client";
import prisma from "../../config/prisma";

const createItemCategory = async (data: ItemCategory) => {
  const result = await prisma.itemCategory.create({
    data: data,
  });
  return result;
};

const getItemCategory = async () => {
  const result = await prisma.itemCategory.findMany({
    orderBy: { name: "asc" },  //
  });
  return result;
};

const updateItemCategory = async (id: string, data: Partial<ItemCategory>) => {
  const result = await prisma.itemCategory.update({
    where: { id },
    data: data,
  });
  return result;
};

const deleteItemCategory = async (id: string) => {
  // Check if there are any lost or found items using this category
  const foundItemsCount = await prisma.foundItem.count({ where: { categoryId: id } });
  const lostItemsCount = await prisma.lostItem.count({ where: { categoryId: id } });

  if (foundItemsCount > 0 || lostItemsCount > 0) {
    throw new Error(
      `Cannot delete category: ${foundItemsCount} found item(s) and ${lostItemsCount} lost item(s) are still using it. Please reassign or delete these items first.`
    );
  }

  const result = await prisma.itemCategory.delete({
    where: { id },
  });
  return result;
};

export const itemcategoryService = {
  createItemCategory,
  getItemCategory,
  updateItemCategory,
  deleteItemCategory,
};