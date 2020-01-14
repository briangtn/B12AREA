FROM openjdk:8

WORKDIR /mobile
ENV ANDROID_HOME /opt/android-sdk-linux
RUN mkdir -p ${ANDROID_HOME} && cd ${ANDROID_HOME} && wget -q https://dl.google.com/android/repository/sdk-tools-linux-3859397.zip -O android_tools.zip && unzip android_tools.zip && rm android_tools.zip
ENV PATH ${PATH}:${ANDROID_HOME}/tools:${ANDROID_HOME}/tools/bin:${ANDROID_HOME}/platform-tools
RUN yes | sdkmanager --licenses
COPY . /mobile

RUN ./gradlew build

CMD cp /mobile/app/build/outputs/apk/debug/app-debug.apk /data/apk/area.apk
