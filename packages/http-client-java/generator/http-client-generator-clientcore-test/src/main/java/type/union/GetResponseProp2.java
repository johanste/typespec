package type.union;

/**
 * Defines values for GetResponseProp2.
 */
public enum GetResponseProp2 {
    /**
     * Enum value 1.
     */
    ONE(1),

    /**
     * Enum value 2.
     */
    TWO(2),

    /**
     * Enum value 3.
     */
    THREE(3);

    /**
     * The actual serialized value for a GetResponseProp2 instance.
     */
    private final int value;

    GetResponseProp2(int value) {
        this.value = value;
    }

    /**
     * Parses a serialized value to a GetResponseProp2 instance.
     * 
     * @param value the serialized value to parse.
     * @return the parsed GetResponseProp2 object, or null if unable to parse.
     */
    public static GetResponseProp2 fromInt(int value) {
        GetResponseProp2[] items = GetResponseProp2.values();
        for (GetResponseProp2 item : items) {
            if (item.toInt() == value) {
                return item;
            }
        }
        return null;
    }

    /**
     * De-serializes the instance to int value.
     * 
     * @return the int value.
     */
    public int toInt() {
        return this.value;
    }
}
