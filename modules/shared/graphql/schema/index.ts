import { builder } from "../builder";

import "./wallet";
import "./balance";
import "./tx";
import "./info";
import "./payment";
import "./key";
import "./session";
import "./signMessage";

export const schema = builder.toSchema();
