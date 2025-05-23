// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.CodeAnalysis.CSharp;

namespace Microsoft.TypeSpec.Generator
{
    internal static class StringExtensions
    {
        private static bool IsWordSeparator(char c) => !SyntaxFacts.IsIdentifierPartCharacter(c) || c == '_';
        private static readonly Regex HumanizedCamelCaseRegex = new Regex(@"([A-Z])", RegexOptions.Compiled);

        [return: NotNullIfNotNull("name")]
        public static string ToCleanName(this string name, bool isCamelCase = true)
        {
            if (string.IsNullOrEmpty(name))
            {
                return name;
            }
            StringBuilder nameBuilder = new StringBuilder();

            int i = 0;

            if (char.IsDigit(name[0]))
            {
                nameBuilder.Append("_");
            }
            else
            {
                while (!SyntaxFacts.IsIdentifierStartCharacter(name[i]))
                {
                    i++;
                }
            }

            bool upperCase = false;
            int firstWordLength = 1;
            for (; i < name.Length; i++)
            {
                var c = name[i];
                if (IsWordSeparator(c))
                {
                    upperCase = true;
                    continue;
                }

                if (nameBuilder.Length == 0 && isCamelCase)
                {
                    c = char.ToUpper(c);
                    upperCase = false;
                }
                else if (nameBuilder.Length < firstWordLength && !isCamelCase)
                {
                    c = char.ToLower(c);
                    upperCase = false;
                    // grow the first word length when this letter follows by two other upper case letters
                    // this happens in OSProfile, where OS is the first word
                    if (i + 2 < name.Length && char.IsUpper(name[i + 1]) && (char.IsUpper(name[i + 2]) || IsWordSeparator(name[i + 2])))
                        firstWordLength++;
                    // grow the first word length when this letter follows by another upper case letter and an end of the string
                    // this happens when the string only has one word, like OS, DNS
                    if (i + 2 == name.Length && char.IsUpper(name[i + 1]))
                        firstWordLength++;
                }

                if (upperCase)
                {
                    c = char.ToUpper(c);
                    upperCase = false;
                }

                nameBuilder.Append(c);
            }

            return nameBuilder.ToString();
        }

        [return: NotNullIfNotNull(nameof(name))]
        public static string ToVariableName(this string name) => ToCleanName(name, isCamelCase: false);

        public static GetPathPartsEnumerator GetFormattableStringFormatParts(string? format) => new GetPathPartsEnumerator(format);

        public static GetPathPartsEnumerator GetFormattableStringFormatParts(ReadOnlySpan<char> format) => new GetPathPartsEnumerator(format);

        public ref struct GetPathPartsEnumerator
        {
            private ReadOnlySpan<char> _path;
            public Part Current { get; private set; }

            public GetPathPartsEnumerator(ReadOnlySpan<char> format)
            {
                _path = format;
                Current = default;
            }

            public readonly GetPathPartsEnumerator GetEnumerator() => this;

            public bool MoveNext()
            {
                var span = _path;
                if (span.Length == 0)
                {
                    return false;
                }

                var separatorIndex = span.IndexOfAny('{', '}');

                if (separatorIndex == -1)
                {
                    Current = new Part(span, true);
                    _path = ReadOnlySpan<char>.Empty;
                    return true;
                }

                var separator = span[separatorIndex];
                // Handle {{ and }} escape sequences
                if (separatorIndex + 1 < span.Length && span[separatorIndex + 1] == separator)
                {
                    Current = new Part(span.Slice(0, separatorIndex + 1), true);
                    _path = span.Slice(separatorIndex + 2);
                    return true;
                }

                var isLiteral = separator == '{';

                // Skip empty literals
                if (isLiteral && separatorIndex == 0 && span.Length > 1)
                {
                    separatorIndex = span.IndexOf('}');
                    if (separatorIndex == -1)
                    {
                        Current = new Part(span.Slice(1), true);
                        _path = ReadOnlySpan<char>.Empty;
                        return true;
                    }

                    Current = new Part(span.Slice(1, separatorIndex - 1), false);
                }
                else
                {
                    Current = new Part(span.Slice(0, separatorIndex), isLiteral);
                }

                _path = span.Slice(separatorIndex + 1);
                return true;
            }

            public readonly ref struct Part
            {
                public Part(ReadOnlySpan<char> span, bool isLiteral)
                {
                    Span = span;
                    IsLiteral = isLiteral;
                }

                public ReadOnlySpan<char> Span { get; }
                public bool IsLiteral { get; }

                public void Deconstruct(out ReadOnlySpan<char> span, out bool isLiteral)
                {
                    span = Span;
                    isLiteral = IsLiteral;
                }

                public void Deconstruct(out ReadOnlySpan<char> span, out bool isLiteral, out int argumentIndex)
                {
                    span = Span;
                    isLiteral = IsLiteral;

                    if (IsLiteral)
                    {
                        argumentIndex = -1;
                    }
                    else
                    {
                        var formatSeparatorIndex = span.IndexOf(':');
                        var indexSpan = formatSeparatorIndex == -1 ? span : span.Slice(0, formatSeparatorIndex);
                        argumentIndex = int.Parse(indexSpan);
                    }
                }
            }
        }

        /// <summary>
        /// Determines if the given name is a C# keyword.
        /// </summary>
        /// <param name="name">The string name of the keyword.</param>
        /// <returns><c>true</c> if the string is a csharp keyword.</returns>
        public static bool IsCSharpKeyword(string? name)
        {
            if (name == null)
            {
                return false;
            }

            SyntaxKind kind = SyntaxFacts.GetKeywordKind(name);
            if (kind == SyntaxKind.None)
            {
                kind = SyntaxFacts.GetContextualKeywordKind(name);
            }

            return SyntaxFacts.IsKeywordKind(kind);
        }

        [return: NotNullIfNotNull(nameof(name))]
        public static string ToXmlDocIdentifierName(this string name)
        {
            var span = name.AsSpan();
            if (span.Length == 0)
            {
                return name;
            }

            if (name[0] != '@')
            {
                return name;
            }

            return span[1..].ToString();
        }

        public static string ToApiVersionMemberName(this string version)
        {
            var sb = new StringBuilder("V");
            int startIndex = version.StartsWith("v", StringComparison.InvariantCultureIgnoreCase) ? 1 : 0;

            for (int i = startIndex; i < version.Length; i++)
            {
                char c = version[i];
                if (c == '-' || c == '.')
                {
                    sb.Append('_');
                }
                else
                {
                    sb.Append(c);
                }
            }

            return CultureInfo.InvariantCulture.TextInfo.ToTitleCase(sb.ToString());
        }

        /// <summary>
        /// Checks if two namespaces share the same last segment
        /// </summary>
        /// <param name="left">the first namespace</param>
        /// <param name="right">the second namespace</param>
        /// <returns></returns>
        public static bool IsLastNamespaceSegmentTheSame(string left, string right)
        {
            // finish this via Span API
            var leftSpan = left.AsSpan();
            var rightSpan = right.AsSpan();
            // swap if left is longer, we ensure left is the shorter one
            if (leftSpan.Length > rightSpan.Length)
            {
                var temp = leftSpan;
                leftSpan = rightSpan;
                rightSpan = temp;
            }
            for (int i = 1; i <= leftSpan.Length; i++)
            {
                var lc = leftSpan[^i];
                var rc = rightSpan[^i];
                // check if each char is the same from the right-most side
                // if both of them are dot, we finished scanning the last segment - and if we could be here, meaning all of them are the same, return true.
                if (lc == '.' && rc == '.')
                {
                    return true;
                }
                // if these are different - there is one different character, return false.
                if (lc != rc)
                {
                    return false;
                }
            }

            // we come here because we run out of characters in left - which means left does not have a dot.
            // if they have the same length, they are identical, return true
            if (leftSpan.Length == rightSpan.Length)
            {
                return true;
            }
            // otherwise, right is longer, we check its next character, if it is the dot, return true, otherwise return false.
            return rightSpan[^(leftSpan.Length + 1)] == '.';
        }

        public static string RemovePeriods(this string input)
        {
            if (string.IsNullOrEmpty(input))
                return input;

            Span<char> buffer = stackalloc char[input.Length];
            int index = 0;

            foreach (char c in input)
            {
                if (c != '.')
                    buffer[index++] = c;
            }

            return buffer.Slice(0, index).ToString();
        }
    }
}
