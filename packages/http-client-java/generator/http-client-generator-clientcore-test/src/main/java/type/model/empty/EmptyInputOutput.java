package type.model.empty;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Empty model used in both parameter and return type.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class EmptyInputOutput implements JsonSerializable<EmptyInputOutput> {
    /**
     * Creates an instance of EmptyInputOutput class.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public EmptyInputOutput() {
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of EmptyInputOutput from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of EmptyInputOutput if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IOException If an error occurs while reading the EmptyInputOutput.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static EmptyInputOutput fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            EmptyInputOutput deserializedEmptyInputOutput = new EmptyInputOutput();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                reader.skipChildren();
            }

            return deserializedEmptyInputOutput;
        });
    }
}
