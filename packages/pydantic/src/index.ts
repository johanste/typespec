import type { EmitContext } from "@typespec/compiler";
import { emitPydantic } from "./emitter.js";
import type { PydanticEmitterOptions } from "./lib.js";

export { $flags, $lib, EmitterOptionsSchema, type PydanticEmitterOptions } from "./lib.js";

/**
 * Internal: TypeSpec emitter entry point
 */
export async function $onEmit(context: EmitContext<PydanticEmitterOptions>) {
  await emitPydantic(context.program, context.emitterOutputDir, context.options);
}
