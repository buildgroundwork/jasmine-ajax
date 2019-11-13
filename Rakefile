ENV['JASMINE_SELENIUM_CONFIG_PATH'] ||= 'spec/support/jasmine_selenium_runner.yml'

require 'jasmine'
require 'jasmine_selenium_runner' if ENV['USE_SAUCE']
load 'jasmine/tasks/jasmine.rake'

namespace :jasmine do
  task :set_env do
    ENV['JASMINE_CONFIG_PATH'] ||= 'spec/support/jasmine.yml'
  end

  task configure: :set_env do
    Jasmine.configure do |config|
      config.runner_browser = :chromeheadless
    end
  end
end

task default: 'jasmine:ci'

