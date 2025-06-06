// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package resiliency.servicedriven;

import com.azure.core.annotation.Generated;
import com.azure.core.annotation.ReturnType;
import com.azure.core.annotation.ServiceClient;
import com.azure.core.annotation.ServiceMethod;
import com.azure.core.exception.ClientAuthenticationException;
import com.azure.core.exception.HttpResponseException;
import com.azure.core.exception.ResourceModifiedException;
import com.azure.core.exception.ResourceNotFoundException;
import com.azure.core.http.rest.RequestOptions;
import com.azure.core.http.rest.Response;
import com.azure.core.util.FluxUtil;
import java.util.Arrays;
import reactor.core.publisher.Mono;
import resiliency.servicedriven.implementation.ResiliencyServiceDrivenClientImpl;

/**
 * Initializes a new instance of the asynchronous ResiliencyServiceDrivenClient type.
 */
@ServiceClient(builder = ResiliencyServiceDrivenClientBuilder.class, isAsync = true)
public final class ResiliencyServiceDrivenAsyncClient {
    @Generated
    private final ResiliencyServiceDrivenClientImpl serviceClient;

    /**
     * Initializes an instance of ResiliencyServiceDrivenAsyncClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Generated
    ResiliencyServiceDrivenAsyncClient(ResiliencyServiceDrivenClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * Added operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response} on successful completion of {@link Mono}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Response<Void>> addOperationWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.addOperationWithResponseAsync(requestOptions);
    }

    /**
     * Test that grew up from accepting no parameters to an optional input parameter.
     * <p><strong>Query Parameters</strong></p>
     * <table border="1">
     * <caption>Query Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>new-parameter</td><td>String</td><td>No</td><td>I'm a new input optional parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addQueryParam}
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response} on successful completion of {@link Mono}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Response<Void>> fromNoneWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.fromNoneWithResponseAsync(requestOptions);
    }

    /**
     * Operation that grew up from accepting one required parameter to accepting a required parameter and an optional
     * parameter.
     * <p><strong>Query Parameters</strong></p>
     * <table border="1">
     * <caption>Query Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>new-parameter</td><td>String</td><td>No</td><td>I'm a new input optional parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addQueryParam}
     * 
     * @param parameter I am a required parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response} on successful completion of {@link Mono}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Response<Void>> fromOneRequiredWithResponse(String parameter, RequestOptions requestOptions) {
        return this.serviceClient.fromOneRequiredWithResponseAsync(parameter, requestOptions);
    }

    /**
     * Tests that we can grow up an operation from accepting one optional parameter to accepting two optional
     * parameters.
     * <p><strong>Query Parameters</strong></p>
     * <table border="1">
     * <caption>Query Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>parameter</td><td>String</td><td>No</td><td>I am an optional parameter</td></tr>
     * <tr><td>new-parameter</td><td>String</td><td>No</td><td>I'm a new input optional parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addQueryParam}
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @return the {@link Response} on successful completion of {@link Mono}.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Response<Void>> fromOneOptionalWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.fromOneOptionalWithResponseAsync(requestOptions);
    }

    /**
     * Added operation.
     * 
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return A {@link Mono} that completes when a successful response is received.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Void> addOperation() {
        // Generated convenience method for addOperationWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return addOperationWithResponse(requestOptions).flatMap(FluxUtil::toMono);
    }

    /**
     * Test that grew up from accepting no parameters to an optional input parameter.
     * 
     * @param newParameter I'm a new input optional parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return A {@link Mono} that completes when a successful response is received.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Void> fromNone(String newParameter) {
        // Generated convenience method for fromNoneWithResponse
        RequestOptions requestOptions = new RequestOptions();
        if (!Arrays.asList("v2").contains(serviceClient.getServiceVersion().getVersion())) {
            return Mono
                .error(new IllegalArgumentException("Parameter newParameter is only available in api-version v2."));
        }
        if (newParameter != null) {
            requestOptions.addQueryParam("new-parameter", newParameter, false);
        }
        return fromNoneWithResponse(requestOptions).flatMap(FluxUtil::toMono);
    }

    /**
     * Test that grew up from accepting no parameters to an optional input parameter.
     * 
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return A {@link Mono} that completes when a successful response is received.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Void> fromNone() {
        // Generated convenience method for fromNoneWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return fromNoneWithResponse(requestOptions).flatMap(FluxUtil::toMono);
    }

    /**
     * Operation that grew up from accepting one required parameter to accepting a required parameter and an optional
     * parameter.
     * 
     * @param parameter I am a required parameter.
     * @param newParameter I'm a new input optional parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return A {@link Mono} that completes when a successful response is received.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Void> fromOneRequired(String parameter, String newParameter) {
        // Generated convenience method for fromOneRequiredWithResponse
        RequestOptions requestOptions = new RequestOptions();
        if (!Arrays.asList("v2").contains(serviceClient.getServiceVersion().getVersion())) {
            return Mono
                .error(new IllegalArgumentException("Parameter newParameter is only available in api-version v2."));
        }
        if (newParameter != null) {
            requestOptions.addQueryParam("new-parameter", newParameter, false);
        }
        return fromOneRequiredWithResponse(parameter, requestOptions).flatMap(FluxUtil::toMono);
    }

    /**
     * Operation that grew up from accepting one required parameter to accepting a required parameter and an optional
     * parameter.
     * 
     * @param parameter I am a required parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return A {@link Mono} that completes when a successful response is received.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Void> fromOneRequired(String parameter) {
        // Generated convenience method for fromOneRequiredWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return fromOneRequiredWithResponse(parameter, requestOptions).flatMap(FluxUtil::toMono);
    }

    /**
     * Tests that we can grow up an operation from accepting one optional parameter to accepting two optional
     * parameters.
     * 
     * @param parameter I am an optional parameter.
     * @param newParameter I'm a new input optional parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return A {@link Mono} that completes when a successful response is received.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Void> fromOneOptional(String parameter, String newParameter) {
        // Generated convenience method for fromOneOptionalWithResponse
        RequestOptions requestOptions = new RequestOptions();
        if (!Arrays.asList("v2").contains(serviceClient.getServiceVersion().getVersion())) {
            return Mono
                .error(new IllegalArgumentException("Parameter newParameter is only available in api-version v2."));
        }
        if (parameter != null) {
            requestOptions.addQueryParam("parameter", parameter, false);
        }
        if (newParameter != null) {
            requestOptions.addQueryParam("new-parameter", newParameter, false);
        }
        return fromOneOptionalWithResponse(requestOptions).flatMap(FluxUtil::toMono);
    }

    /**
     * Tests that we can grow up an operation from accepting one optional parameter to accepting two optional
     * parameters.
     * 
     * @param parameter I am an optional parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return A {@link Mono} that completes when a successful response is received.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Void> fromOneOptional(String parameter) {
        // Generated convenience method for fromOneOptionalWithResponse
        RequestOptions requestOptions = new RequestOptions();
        if (parameter != null) {
            requestOptions.addQueryParam("parameter", parameter, false);
        }
        return fromOneOptionalWithResponse(requestOptions).flatMap(FluxUtil::toMono);
    }

    /**
     * Tests that we can grow up an operation from accepting one optional parameter to accepting two optional
     * parameters.
     * 
     * @throws HttpResponseException thrown if the request is rejected by server.
     * @throws ClientAuthenticationException thrown if the request is rejected by server on status code 401.
     * @throws ResourceNotFoundException thrown if the request is rejected by server on status code 404.
     * @throws ResourceModifiedException thrown if the request is rejected by server on status code 409.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return A {@link Mono} that completes when a successful response is received.
     */
    @Generated
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Void> fromOneOptional() {
        // Generated convenience method for fromOneOptionalWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return fromOneOptionalWithResponse(requestOptions).flatMap(FluxUtil::toMono);
    }
}
