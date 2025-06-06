import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Discriminator, Model, Union } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { JsonTransform } from "./json-transform.jsx";

export interface JsonTransformDiscriminatorProps {
  itemRef: ay.Refkey | ay.Children;
  discriminator: Discriminator;
  type: Union | Model;
  target: "application" | "transport";
}

export function JsonTransformDiscriminator(props: JsonTransformDiscriminatorProps) {
  const { $ } = useTsp();
  const discriminatedUnion = $.model.is(props.type)
    ? $.model.getDiscriminatedUnion(props.type)
    : $.union.getDiscriminatedUnion(props.type);

  const propertyName = props.discriminator.propertyName;

  if (!discriminatedUnion || !propertyName) {
    return ay.code`${props.itemRef}`;
  }

  const discriminatorRef = ay.code`${props.itemRef}.${props.discriminator.propertyName}`;

  // Need to cast to make sure that the general types which usually have a broader
  // type in the discriminator are compatible.
  const itemRef = ay.code`${props.itemRef} as any`;
  const discriminatingCases = ay.mapJoin(
    () => discriminatedUnion.variants,
    (name, variant) => {
      return ay.code`
    if( discriminatorValue === ${JSON.stringify(name)}) {
      return ${(<JsonTransform type={variant} target={props.target} itemRef={itemRef} />)}!
    }
    `;
    },
    { joiner: "\n\n" },
  );

  return (
    <>
      const discriminatorValue = {discriminatorRef};{discriminatingCases}
      <>console.warn(`Received unknown kind: ` + discriminatorValue); return {itemRef}</>
    </>
  );
}

export function getJsonTransformDiscriminatorRefkey(
  type: Union | Model,
  target: "application" | "transport",
) {
  return ay.refkey(type, "json_transform_discriminator_", target);
}

export interface JsonTransformDiscriminatorDeclarationProps {
  type: Union | Model;
  target: "application" | "transport";
}

export function JsonTransformDiscriminatorDeclaration(
  props: JsonTransformDiscriminatorDeclarationProps,
) {
  const { $ } = useTsp();
  let discriminator: Discriminator | undefined;
  if ($.model.is(props.type)) {
    discriminator = $.model.getDiscriminatedUnion(props.type);
  } else {
    const discriminatedUnion = $.union.getDiscriminatedUnion(props.type);
    if (discriminatedUnion?.options.discriminatorPropertyName) {
      discriminator = { propertyName: discriminatedUnion.options.discriminatorPropertyName };
    }
  }
  if (!discriminator) {
    return null;
  }

  const namePolicy = ay.useNamePolicy();
  const transformName = namePolicy.getName(
    `json_${props.type.name}_to_${props.target}_discriminator`,
    "function",
  );

  const typeRef = ay.refkey(props.type);
  const returnType = props.target === "transport" ? "any" : typeRef;
  const inputType = props.target === "transport" ? typeRef : "any";
  const inputRef = ay.refkey();

  const parameters: ts.ParameterDescriptor[] = [
    { name: "input_", type: inputType, refkey: inputRef, optional: true },
  ];

  return (
    <ts.FunctionDeclaration
      name={transformName}
      export
      returnType={returnType}
      parameters={parameters}
      refkey={getJsonTransformDiscriminatorRefkey(props.type, props.target)}
    >
      {ay.code`
    if(!${inputRef}) {
      return ${inputRef} as any;
    }
    `}
      <JsonTransformDiscriminator {...props} itemRef={inputRef} discriminator={discriminator} />
    </ts.FunctionDeclaration>
  );
}
