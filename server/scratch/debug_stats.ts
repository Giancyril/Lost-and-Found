import { foundItemService } from "./src/app/modules/foundItems/foundItem.service";
import { lostTItemServices } from "./src/app/modules/lostItem/lostItem.service";
import { userService } from "./src/app/modules/user/user.service";
import { claimsService } from "./src/app/modules/claim/claim.service";

async function test() {
  try {
    console.log("Found Items...");
    await foundItemService.getFoundItem({ limit: 10 });
    console.log("Lost Items...");
    await lostTItemServices.getLostItem({ limit: 10 });
    console.log("All Lost Items...");
    await lostTItemServices.getAllLostItems({ limit: 10 });
    console.log("Users...");
    await userService.allUsers();
    console.log("Claims...");
    await claimsService.getClaim();
    console.log("Success!");
  } catch (e) {
    console.error("FAILED:", e);
  }
}

test();
