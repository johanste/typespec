// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package type.property.additionalproperties.models;

import com.azure.core.annotation.Fluent;
import com.azure.core.annotation.Generated;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonToken;
import com.azure.json.JsonWriter;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The model is from Record&lt;ModelForRecord[]&gt; type.
 */
@Fluent
public final class IsModelArrayAdditionalProperties implements JsonSerializable<IsModelArrayAdditionalProperties> {
    /*
     * The knownProp property.
     */
    @Generated
    private final List<ModelForRecord> knownProp;

    /*
     * The model is from Record<ModelForRecord[]> type.
     */
    @Generated
    private Map<String, List<ModelForRecord>> additionalProperties;

    /**
     * Creates an instance of IsModelArrayAdditionalProperties class.
     * 
     * @param knownProp the knownProp value to set.
     */
    @Generated
    public IsModelArrayAdditionalProperties(List<ModelForRecord> knownProp) {
        this.knownProp = knownProp;
    }

    /**
     * Get the knownProp property: The knownProp property.
     * 
     * @return the knownProp value.
     */
    @Generated
    public List<ModelForRecord> getKnownProp() {
        return this.knownProp;
    }

    /**
     * Get the additionalProperties property: The model is from Record&lt;ModelForRecord[]&gt; type.
     * 
     * @return the additionalProperties value.
     */
    @Generated
    public Map<String, List<ModelForRecord>> getAdditionalProperties() {
        return this.additionalProperties;
    }

    /**
     * Set the additionalProperties property: The model is from Record&lt;ModelForRecord[]&gt; type.
     * 
     * @param additionalProperties the additionalProperties value to set.
     * @return the IsModelArrayAdditionalProperties object itself.
     */
    @Generated
    public IsModelArrayAdditionalProperties
        setAdditionalProperties(Map<String, List<ModelForRecord>> additionalProperties) {
        this.additionalProperties = additionalProperties;
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Generated
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeArrayField("knownProp", this.knownProp, (writer, element) -> writer.writeJson(element));
        if (additionalProperties != null) {
            for (Map.Entry<String, List<ModelForRecord>> additionalProperty : additionalProperties.entrySet()) {
                jsonWriter.writeUntypedField(additionalProperty.getKey(), additionalProperty.getValue());
            }
        }
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of IsModelArrayAdditionalProperties from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of IsModelArrayAdditionalProperties if the JsonReader was pointing to an instance of it, or
     * null if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the IsModelArrayAdditionalProperties.
     */
    @Generated
    public static IsModelArrayAdditionalProperties fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            List<ModelForRecord> knownProp = null;
            Map<String, List<ModelForRecord>> additionalProperties = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("knownProp".equals(fieldName)) {
                    knownProp = reader.readArray(reader1 -> ModelForRecord.fromJson(reader1));
                } else {
                    if (additionalProperties == null) {
                        additionalProperties = new LinkedHashMap<>();
                    }

                    List<ModelForRecord> additionalPropertiesArrayItem
                        = reader.readArray(reader1 -> ModelForRecord.fromJson(reader1));
                    additionalProperties.put(fieldName, additionalPropertiesArrayItem);
                }
            }
            IsModelArrayAdditionalProperties deserializedIsModelArrayAdditionalProperties
                = new IsModelArrayAdditionalProperties(knownProp);
            deserializedIsModelArrayAdditionalProperties.additionalProperties = additionalProperties;

            return deserializedIsModelArrayAdditionalProperties;
        });
    }
}
