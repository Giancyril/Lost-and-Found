import type { modals } from "../../types/types";
import { notify } from "../../utils/notify";

const Modals = (data: modals) => {
  if (data.status === true) {
    return notify.success(data.message);
  }
  if (data.status === false) {
    return notify.error(data.message);
  }
};

export default Modals;
