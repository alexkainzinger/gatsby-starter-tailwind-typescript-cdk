import { Construct } from "constructs"
import { CfnOutput, Stack, StackProps } from "aws-cdk-lib"

// New imports in V2
import { aws_s3 as s3 } from "aws-cdk-lib"
import { aws_s3_deployment as s3deploy } from "aws-cdk-lib"
import { aws_cloudfront as cloudFront } from "aws-cdk-lib"

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const s3Site = new s3.Bucket(this, "GatbsyCDKStarter", {
      bucketName: "gatsby-cdk-starter",
      publicReadAccess: true,
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html"
    })

    this.enableCorsOnBucket(s3Site)

    // Create a new CloudFront Distribution
    const distribution = new cloudFront.CloudFrontWebDistribution(this, `gatsby-cdk-starter-distribution`, {
      comment: `gatsby-cdk-starter - CloudFront Distribution`,
      viewerProtocolPolicy: cloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: s3Site
          },
          behaviors: [
            {
              isDefaultBehavior: true,
              compress: true,
              allowedMethods: cloudFront.CloudFrontAllowedMethods.GET_HEAD,
              cachedMethods: cloudFront.CloudFrontAllowedCachedMethods.GET_HEAD,
              forwardedValues: {
                queryString: true,
                cookies: {
                  forward: "none"
                },
                headers: ["Access-Control-Request-Headers", "Access-Control-Request-Method", "Origin"]
              }
            }
          ]
        }
      ],
      errorConfigurations: [
        {
          errorCode: 403,
          errorCachingMinTtl: 10,
          responsePagePath: "/404/index.html",
          responseCode: 200
        },
        {
          errorCode: 404,
          errorCachingMinTtl: 10,
          responsePagePath: "/404/index.html",
          responseCode: 200
        }
      ]
    })

    // Setup Bucket Deployment to automatically deploy new assets and invalidate cache
    new s3deploy.BucketDeployment(this, `gatsby-cdk-starter-s3bucketdeployment`, {
      sources: [s3deploy.Source.asset("../public")],
      destinationBucket: s3Site,
      distribution: distribution,
      distributionPaths: ["/*"]
    })

    // Final CloudFront URL
    new CfnOutput(this, "CloudFront URL", {
      value: distribution.distributionDomainName
    })
  }

  /**
   * Enables CORS access on the given bucket
   *
   * @memberof CxpInfrastructureStack
   */
  enableCorsOnBucket = (bucket: s3.Bucket): void => {
    const cfnBucket = bucket.node.findChild("Resource") as s3.CfnBucket
    cfnBucket.addPropertyOverride("CorsConfiguration", {
      CorsRules: [
        {
          AllowedOrigins: ["*"],
          AllowedMethods: ["HEAD", "GET", "PUT", "POST", "DELETE"],
          ExposedHeaders: ["x-amz-server-side-encryption", "x-amz-request-id", "x-amz-id-2"],
          AllowedHeaders: ["*"]
        }
      ]
    })
  }
}
