// <auto-generated/>

#nullable disable

using System;
using System.ComponentModel;
using System.Globalization;

namespace SampleTypeSpec
{
    /// <summary> The Thing_requiredLiteralFloat. </summary>
    public readonly partial struct ThingRequiredLiteralFloat : IEquatable<ThingRequiredLiteralFloat>
    {
        private readonly float _value;
        /// <summary> 1.23. </summary>
        private const float _123Value = 1.23F;

        /// <summary> Initializes a new instance of <see cref="ThingRequiredLiteralFloat"/>. </summary>
        /// <param name="value"> The value. </param>
        public ThingRequiredLiteralFloat(float value)
        {
            _value = value;
        }

        /// <summary> 1.23. </summary>
        public static ThingRequiredLiteralFloat _123 { get; } = new ThingRequiredLiteralFloat(_123Value);

        /// <summary> Determines if two <see cref="ThingRequiredLiteralFloat"/> values are the same. </summary>
        /// <param name="left"> The left value to compare. </param>
        /// <param name="right"> The right value to compare. </param>
        public static bool operator ==(ThingRequiredLiteralFloat left, ThingRequiredLiteralFloat right) => left.Equals(right);

        /// <summary> Determines if two <see cref="ThingRequiredLiteralFloat"/> values are not the same. </summary>
        /// <param name="left"> The left value to compare. </param>
        /// <param name="right"> The right value to compare. </param>
        public static bool operator !=(ThingRequiredLiteralFloat left, ThingRequiredLiteralFloat right) => !left.Equals(right);

        /// <summary> Converts a string to a <see cref="ThingRequiredLiteralFloat"/>. </summary>
        /// <param name="value"> The value. </param>
        public static implicit operator ThingRequiredLiteralFloat(float value) => new ThingRequiredLiteralFloat(value);

        /// <inheritdoc/>
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override bool Equals(object obj) => obj is ThingRequiredLiteralFloat other && Equals(other);

        /// <inheritdoc/>
        public bool Equals(ThingRequiredLiteralFloat other) => Equals(_value, other._value);

        /// <inheritdoc/>
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override int GetHashCode() => _value.GetHashCode();

        /// <inheritdoc/>
        public override string ToString() => _value.ToString(CultureInfo.InvariantCulture);
    }
}
