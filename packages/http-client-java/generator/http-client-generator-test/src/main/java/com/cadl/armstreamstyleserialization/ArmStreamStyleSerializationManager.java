// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.cadl.armstreamstyleserialization;

import com.azure.core.credential.TokenCredential;
import com.azure.core.http.HttpPipeline;
import com.azure.core.management.profile.AzureProfile;
import com.cadl.armstreamstyleserialization.fluent.ArmStreamStyleSerializationClient;
import com.cadl.armstreamstyleserialization.implementation.ArmStreamStyleSerializationClientBuilder;
import com.cadl.armstreamstyleserialization.implementation.FishesImpl;
import com.cadl.armstreamstyleserialization.implementation.TopLevelArmResourcesImpl;
import com.cadl.armstreamstyleserialization.models.Fishes;
import com.cadl.armstreamstyleserialization.models.TopLevelArmResources;
import java.time.Duration;
import java.util.Objects;

/**
 * Entry point to ArmStreamStyleSerializationManager.
 * Arm Resource Provider management API.
 */
public final class ArmStreamStyleSerializationManager {
    private Fishes fishes;

    private TopLevelArmResources topLevelArmResources;

    private final ArmStreamStyleSerializationClient clientObject;

    private ArmStreamStyleSerializationManager(HttpPipeline httpPipeline, AzureProfile profile,
        Duration defaultPollInterval) {
        Objects.requireNonNull(httpPipeline, "'httpPipeline' cannot be null.");
        Objects.requireNonNull(profile, "'profile' cannot be null.");
        this.clientObject = new ArmStreamStyleSerializationClientBuilder().pipeline(httpPipeline)
            .endpoint(profile.getEnvironment().getResourceManagerEndpoint())
            .subscriptionId(profile.getSubscriptionId())
            .defaultPollInterval(defaultPollInterval)
            .buildClient();
    }

    /**
     * Creates an instance of ArmStreamStyleSerialization service API entry point.
     * 
     * @param credential the credential to use.
     * @param profile the Azure profile for client.
     * @return the ArmStreamStyleSerialization service API instance.
     */
    public static ArmStreamStyleSerializationManager authenticate(TokenCredential credential, AzureProfile profile) {
        Objects.requireNonNull(credential, "'credential' cannot be null.");
        Objects.requireNonNull(profile, "'profile' cannot be null.");
        return configure().authenticate(credential, profile);
    }

    /**
     * Creates an instance of ArmStreamStyleSerialization service API entry point.
     * 
     * @param httpPipeline the {@link HttpPipeline} configured with Azure authentication credential.
     * @param profile the Azure profile for client.
     * @return the ArmStreamStyleSerialization service API instance.
     */
    public static ArmStreamStyleSerializationManager authenticate(HttpPipeline httpPipeline, AzureProfile profile) {
        Objects.requireNonNull(httpPipeline, "'httpPipeline' cannot be null.");
        Objects.requireNonNull(profile, "'profile' cannot be null.");
        return new ArmStreamStyleSerializationManager(httpPipeline, profile, null);
    }

    /**
     * Gets a Configurable instance that can be used to create ArmStreamStyleSerializationManager with optional
     * configuration.
     * 
     * @return the Configurable instance allowing configurations.
     */
    public static Configurable configure() {
        return new ArmStreamStyleSerializationManager.Configurable();
    }

    /**
     * Gets the resource collection API of Fishes.
     * 
     * @return Resource collection API of Fishes.
     */
    public Fishes fishes() {
        if (this.fishes == null) {
            this.fishes = new FishesImpl(clientObject.getFishes(), this);
        }
        return fishes;
    }

    /**
     * Gets the resource collection API of TopLevelArmResources.
     * 
     * @return Resource collection API of TopLevelArmResources.
     */
    public TopLevelArmResources topLevelArmResources() {
        if (this.topLevelArmResources == null) {
            this.topLevelArmResources = new TopLevelArmResourcesImpl(clientObject.getTopLevelArmResources(), this);
        }
        return topLevelArmResources;
    }

    /**
     * Gets wrapped service client ArmStreamStyleSerializationClient providing direct access to the underlying
     * auto-generated API implementation, based on Azure REST API.
     * 
     * @return Wrapped service client ArmStreamStyleSerializationClient.
     */
    public ArmStreamStyleSerializationClient serviceClient() {
        return this.clientObject;
    }
}