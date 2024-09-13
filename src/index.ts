import { log, InvalidConfigurationError, isEmptyOrSpaces } from 'builder-util';
import { Publisher, UploadTask, PublishContext } from 'electron-publish';
import COS from 'cos-nodejs-sdk-v5';
import path from 'node:path';
import fsPromise from 'node:fs/promises';

interface COSPublisherOptions {
  secretId?: string;
  secretKey?: string;

  bucket: string;
  region: string;
  path: string;

  afterUpload: (cosClient: COS, uploadName: string) => void;
}

export default class COSPublisher extends Publisher {
  readonly providerName = 'cos';

  private readonly option: COSPublisherOptions;
  private readonly cosClient: COS;

  constructor(context: PublishContext, option: COSPublisherOptions) {
    super(context);

    const secretId = option.secretId || process.env.COS_SECRET_ID || null;
    const secretKey = option.secretKey || process.env.COS_SECRET_KEY || null;

    if (isEmptyOrSpaces(secretId)) {
      throw new InvalidConfigurationError(
        `secretId is null. Please set on "options" or using env "COS_SECRET_ID"`
      );
    }
    if (isEmptyOrSpaces(secretKey)) {
      throw new InvalidConfigurationError(
        `secretKey is null. Please set on "options" or using env "COS_SECRET_KEY"`
      );
    }

    this.option = option;
    this.cosClient = new COS({
      SecretId: option.secretId,
      SecretKey: option.secretKey,
    });
    log.info(
      {
        info: `bucket: ${option.bucket}; region: ${option.region}; path: ${option.path}`,
      },
      'electron-publisher-cos:initial'
    );
  }

  upload(task: UploadTask): Promise<any> {
    return this.context.cancellationToken.createPromise(
      async (resolve, reject) => {
        const { file } = task;

        const fileName = path.basename(file);
        let uploadName = fileName;
        if (this.option.path) {
          uploadName = path.join(this.option.path, fileName);
        }

        const progressBar = this.createProgressBar(fileName, 200);
        const fileStat = await fsPromise.stat(task.file);

        log.info(
          {
            info: `${fileName}(${fileStat.size}) uploading...`,
          },
          'electron-publisher-cos:upload:start'
        );
        this.cosClient.uploadFile(
          {
            Bucket: this.option.bucket,
            Region: this.option.region,
            Key: uploadName,
            FilePath: file,
            onProgress: (progressData) => {
              progressBar?.update(progressData.percent);
            },
          },
          (err, data) => {
            if (err) {
              log.error(
                {
                  message: `${fileName} upload failed! ❌ (${err.message})`,
                },
                'electron-publisher-cos:upload:done'
              );
              reject(
                new Error(
                  `${fileName} upload failed. Error message: ${err.message}`
                )
              );
            } else {
              log.info(
                {
                  info: `${fileName} upload success! ✅`,
                },
                'electron-publisher-cos:upload:done'
              );
              if (this.option.afterUpload) {
                this.option.afterUpload(this.cosClient, uploadName);
              }
              resolve(data);
            }
          }
        );
      }
    );
  }

  toString(): string {
    return this.providerName;
  }
}
