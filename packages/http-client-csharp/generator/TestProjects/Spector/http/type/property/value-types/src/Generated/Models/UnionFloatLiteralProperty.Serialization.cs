// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace _Type.Property.ValueTypes
{
    public partial class UnionFloatLiteralProperty : IJsonModel<UnionFloatLiteralProperty>
    {
        internal UnionFloatLiteralProperty() => throw null;

        void IJsonModel<UnionFloatLiteralProperty>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        UnionFloatLiteralProperty IJsonModel<UnionFloatLiteralProperty>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected virtual UnionFloatLiteralProperty JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<UnionFloatLiteralProperty>.Write(ModelReaderWriterOptions options) => throw null;

        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        UnionFloatLiteralProperty IPersistableModel<UnionFloatLiteralProperty>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected virtual UnionFloatLiteralProperty PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<UnionFloatLiteralProperty>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;

        public static implicit operator BinaryContent(UnionFloatLiteralProperty unionFloatLiteralProperty) => throw null;

        public static explicit operator UnionFloatLiteralProperty(ClientResult result) => throw null;
    }
}
